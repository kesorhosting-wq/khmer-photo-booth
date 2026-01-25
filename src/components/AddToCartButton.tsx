import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryFunction } from "@/types/shop";

interface AddToCartButtonProps {
  productId: string;
  orderUrl?: string | null;
  categoryId?: string | null;
  buttonStyle?: {
    backgroundColor?: string;
    color?: string;
  };
  className?: string;
}

export const AddToCartButton = ({
  productId,
  orderUrl,
  categoryId,
  buttonStyle,
  className = "",
}: AddToCartButtonProps) => {
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [functionType, setFunctionType] = useState<CategoryFunction | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [fetchingType, setFetchingType] = useState(true);

  useEffect(() => {
    const fetchCategoryFunction = async () => {
      setFetchingType(true);
      if (!categoryId) {
        // No category = link type (just external link)
        setFunctionType('link');
        setFetchingType(false);
        return;
      }

      const { data } = await supabase
        .from("categories")
        .select("function_type")
        .eq("id", categoryId)
        .single();

      const funcType = (data?.function_type as CategoryFunction) || 'link';
      setFunctionType(funcType);

      // If account type, fetch available stock using secure function
      if (funcType === 'account') {
        const { data: count } = await supabase
          .rpc('get_available_account_count', { p_product_id: productId });
        
        setStockCount(count || 0);
      }
      setFetchingType(false);
    };

    fetchCategoryFunction();
  }, [categoryId, productId]);

  // Subscribe to real-time stock updates
  useEffect(() => {
    if (functionType !== 'account') return;

    const channel = supabase
      .channel(`cart-stock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_accounts',
          filter: `product_id=eq.${productId}`,
        },
        async () => {
          // Refetch stock using secure function
          const { data: count } = await supabase
            .rpc('get_available_account_count', { p_product_id: productId });
          
          setStockCount(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [functionType, productId]);

  const isInCart = items.some(i => i.product_id === productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // For link type, just open the external URL
    if (functionType === 'link') {
      if (orderUrl) {
        window.open(orderUrl, "_blank");
      }
      return;
    }

    // For account/upload types, require login
    if (!user) {
      navigate("/auth");
      return;
    }

    if (isInCart) {
      navigate("/cart");
      return;
    }

    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };

  // Still loading category type
  if (fetchingType) {
    return (
      <Button
        disabled
        className={`w-full font-semibold py-1.5 sm:py-2 text-xs sm:text-sm rounded-full ${className}`}
        style={buttonStyle}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  // For link type, show "Order Now" only if URL exists
  if (functionType === 'link') {
    if (!orderUrl) return null;
    return (
      <Button
        onClick={handleClick}
        className={`w-full font-semibold py-1.5 sm:py-2 text-xs sm:text-sm rounded-full hover:opacity-90 ${className}`}
        style={buttonStyle}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Order Now
      </Button>
    );
  }

  // For account/upload types, show cart button
  const isOutOfStock = functionType === 'account' && stockCount === 0;

  return (
    <Button
      onClick={handleClick}
      disabled={loading || isOutOfStock}
      className={`w-full font-semibold py-1.5 sm:py-2 text-xs sm:text-sm rounded-full hover:opacity-90 ${className}`}
      style={buttonStyle}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isOutOfStock ? (
        "Out of Stock"
      ) : isInCart ? (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
};
