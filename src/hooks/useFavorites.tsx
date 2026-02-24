import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Favorite {
  id: string;
  product_id: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  addFavorite: (productId: string) => Promise<boolean>;
  removeFavorite: (productId: string) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      refetch: fetchFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Fallback for components outside provider - return no-op version
    return {
      favorites: [] as Favorite[],
      loading: false,
      addFavorite: async () => false,
      removeFavorite: async () => false,
      toggleFavorite: async () => false,
      isFavorite: () => false,
      refetch: async () => {},
    };
  }
  return context;
};
