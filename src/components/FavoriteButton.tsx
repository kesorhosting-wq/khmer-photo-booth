import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export const FavoriteButton = ({
  productId,
  className,
  size = "icon",
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading } = useFavorites();

  const isFav = isFavorite(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleFavorite(productId);
  };

  return (
    <Button
      size={size}
      variant="ghost"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "transition-all duration-200",
        isFav
          ? "text-red-500 hover:text-red-400 hover:bg-red-500/10"
          : "text-white/70 hover:text-red-400 hover:bg-white/10",
        className
      )}
      title={user ? (isFav ? "Remove from favorites" : "Add to favorites") : "Sign in to save favorites"}
    >
      <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
    </Button>
  );
};
