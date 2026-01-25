import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Favorite {
  id: string;
  product_id: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select("id, product_id")
      .eq("user_id", user.id);

    if (data && !error) {
      setFavorites(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return false;
    }

    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      if (error.code === "23505") {
        toast.info("Already in favorites");
      } else {
        toast.error("Failed to add favorite");
      }
      return false;
    }

    toast.success("Added to favorites!");
    fetchFavorites();
    return true;
  };

  const removeFavorite = async (productId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      toast.error("Failed to remove favorite");
      return false;
    }

    toast.success("Removed from favorites");
    fetchFavorites();
    return true;
  };

  const toggleFavorite = async (productId: string) => {
    const isFav = isFavorite(productId);
    if (isFav) {
      return removeFavorite(productId);
    } else {
      return addFavorite(productId);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some((f) => f.product_id === productId);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
