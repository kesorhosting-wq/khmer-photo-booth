import { useState, useEffect } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Trash2, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: string | null;
  order_url: string | null;
}

interface FavoritesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FavoritesDialog = ({ open, onOpenChange }: FavoritesDialogProps) => {
  const { favorites, removeFavorite, loading: favLoading } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && favorites.length > 0) {
      fetchProducts();
    } else if (favorites.length === 0) {
      setProducts([]);
    }
  }, [open, favorites]);

  const fetchProducts = async () => {
    setLoading(true);
    const productIds = favorites.map((f) => f.product_id);
    
    const { data } = await supabase
      .from("products")
      .select("id, name, image_url, price, order_url")
      .in("id", productIds);

    if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleRemove = async (productId: string) => {
    await removeFavorite(productId);
  };

  const handleOrder = (orderUrl: string) => {
    window.open(orderUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-gold/30 max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display flex items-center gap-2">
            <Heart className="w-5 h-5" />
            My Favorites
          </DialogTitle>
        </DialogHeader>

        {loading || favLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No favorites yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Click the heart icon on products to save them here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-input/30 border border-gold/20"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">
                      {product.name}
                    </h4>
                    {product.price && (
                      <p className="text-gold text-sm">{product.price}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {product.order_url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOrder(product.order_url!)}
                        className="text-gold hover:text-gold-light hover:bg-gold/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(product.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
