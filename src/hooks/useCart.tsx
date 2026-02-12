import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { CartItem, Category, CategoryFunction } from "@/types/shop";

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getProductCategoryFunction: (productId: string) => Promise<CategoryFunction | null>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(id, name, image_url, price, category_id)
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching cart:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const getProductCategoryFunction = async (productId: string): Promise<CategoryFunction | null> => {
    // First get the product's category
    const { data: product } = await supabase
      .from("products")
      .select("category_id")
      .eq("id", productId)
      .single();

    if (!product?.category_id) return null;

    // Then get the category's function type
    const { data: category } = await supabase
      .from("categories")
      .select("function_type")
      .eq("id", product.category_id)
      .single();

    return (category?.function_type as CategoryFunction) || null;
  };

  const addToCart = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return false;
    }

    // Check if category function allows cart (not 'link')
    const functionType = await getProductCategoryFunction(productId);
    if (functionType === 'link') {
      toast.error("This product cannot be added to cart");
      return false;
    }

    // For account products, check if any accounts are available using secure RPC
    if (functionType === 'account') {
      const { data: count, error } = await supabase
        .rpc('get_available_account_count', { p_product_id: productId });

      if (error || !count || count === 0) {
        toast.error("This product is out of stock");
        return false;
      }
    }

    // Check if already in cart
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      toast.info("Item already in cart");
      return true;
    }

    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, product_id: productId, quantity: 1 });

    if (error) {
      toast.error("Failed to add to cart");
      return false;
    }

    toast.success("Added to cart!");
    await fetchCart();
    return true;
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      toast.error("Failed to remove from cart");
    } else {
      toast.success("Removed from cart");
      await fetchCart();
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      toast.error("Failed to update quantity");
    } else {
      await fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to clear cart");
    } else {
      setItems([]);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      items,
      loading,
      itemCount: items.length,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getProductCategoryFunction,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
