import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import type { CategoryFunction } from "@/types/shop";

interface CartProductInfo {
  productId: string;
  categoryFunction: CategoryFunction | null;
  stockCount: number | null;
}

const Cart = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, loading, removeFromCart, updateQuantity } = useCart();
  const [productInfo, setProductInfo] = useState<Record<string, CartProductInfo>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProductInfo = async () => {
      const info: Record<string, CartProductInfo> = {};
      
      for (const item of items) {
        if (!item.product?.category_id) {
          info[item.product_id] = { productId: item.product_id, categoryFunction: null, stockCount: null };
          continue;
        }

        const { data: category } = await supabase
          .from("categories")
          .select("function_type")
          .eq("id", item.product.category_id)
          .single();

        const funcType = (category?.function_type as CategoryFunction) || 'link';
        let stockCount = null;

        if (funcType === 'account') {
          const { count } = await supabase
            .from("product_accounts")
            .select("id", { count: 'exact', head: true })
            .eq("product_id", item.product_id)
            .eq("is_sold", false);
          stockCount = count || 0;
        }

        info[item.product_id] = { productId: item.product_id, categoryFunction: funcType, stockCount };
      }

      setProductInfo(info);
    };

    if (items.length > 0) {
      fetchProductInfo();
    }
  }, [items]);

  const parsePrice = (priceStr: string | null | undefined): number => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(numStr) || 0;
  };

  const getCurrency = (priceStr: string | null | undefined): string => {
    if (!priceStr) return '$';
    if (priceStr.includes('៛')) return '៛';
    return '$';
  };

  const totalAmount = items.reduce((sum, item) => {
    const price = parsePrice(item.product?.price);
    return sum + (price * item.quantity);
  }, 0);

  const currency = items[0]?.product?.price ? getCurrency(items[0].product.price) : '$';

  // Redirect if not authenticated (after auth is loaded)
  if (!authLoading && !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-card border-b border-gold/20 py-4 px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display gold-text">Shopping Cart</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-display text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Browse our products and add something to your cart!</p>
            <Button onClick={() => navigate("/")} className="bg-gold text-primary-foreground hover:bg-gold-dark">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const info = productInfo[item.product_id];
                const isAccountType = info?.categoryFunction === 'account';
                const maxQuantity = isAccountType ? (info.stockCount || 1) : 99;

                return (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-4 rounded-lg bg-card border border-gold/20"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={item.product?.image_url} 
                        alt={item.product?.name}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.product?.name}
                      </h3>
                      <p className="text-gold font-bold">
                        {item.product?.price}
                      </p>
                      {isAccountType && info.stockCount !== null && (
                        <p className="text-xs text-muted-foreground">
                          {info.stockCount} in stock
                        </p>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-foreground">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= maxQuantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="border-t border-gold/20 pt-6 space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-gold">{totalAmount.toFixed(2)}{currency}</span>
              </div>

              <Button 
                onClick={() => navigate("/checkout")}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark font-display text-lg py-6"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
