import { useState, useEffect, useRef } from "react";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { FavoriteButton } from "./FavoriteButton";
import { AddToCartButton } from "./AddToCartButton";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { CategoryFunction } from "@/types/shop";

interface Product {
  id: string;
  name: string;
  image: string;
  price?: string;
  description?: string;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  telegram_url?: string | null;
  order_url?: string | null;
  image_fit?: string | null;
  image_custom_width?: number | null;
  image_custom_height?: number | null;
  category_id?: string | null;
}

interface CardTheme {
  bgColor: string;
  bgImageUrl?: string | null;
  borderColor: string;
  nameColor: string;
  priceColor: string;
  descriptionColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  shineColor?: string;
  shineSpeed?: number;
}

interface DialogTheme {
  bgColor: string;
  bgImageUrl?: string | null;
  borderColor: string;
  titleColor: string;
  priceColor: string;
  descriptionColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  facebookIconColor: string;
  tiktokIconColor: string;
  telegramIconColor: string;
  closeIconColor: string;
  facebookIconUrl?: string | null;
  tiktokIconUrl?: string | null;
  telegramIconUrl?: string | null;
}

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  cardTheme?: CardTheme;
  dialogTheme?: DialogTheme;
}

export const ProductCard = ({ product, cardTheme, dialogTheme }: ProductCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [functionType, setFunctionType] = useState<CategoryFunction | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);

  // Fetch category function type and stock count
  useEffect(() => {
    const fetchData = async () => {
      if (!product.category_id) {
        setFunctionType('link');
        return;
      }

      const { data } = await supabase
        .from("categories")
        .select("function_type")
        .eq("id", product.category_id)
        .single();

      const funcType = (data?.function_type as CategoryFunction) || 'link';
      setFunctionType(funcType);

      // Fetch stock count for account type products
      if (funcType === 'account') {
        const { count } = await supabase
          .from("product_accounts")
          .select("id", { count: 'exact', head: true })
          .eq("product_id", product.id)
          .eq("is_sold", false);
        
        setStockCount(count || 0);
      }
    };
    fetchData();
  }, [product.category_id, product.id]);

  // Default theme values
  const theme = {
    bgColor: cardTheme?.bgColor || "#1a1a2e",
    bgImageUrl: cardTheme?.bgImageUrl,
    borderColor: cardTheme?.borderColor || "#d4af37",
    nameColor: cardTheme?.nameColor || "#d4af37",
    priceColor: cardTheme?.priceColor || "#d4af37",
    descriptionColor: cardTheme?.descriptionColor || "#9ca3af",
    buttonBgColor: cardTheme?.buttonBgColor || "#d4a574",
    buttonTextColor: cardTheme?.buttonTextColor || "#1a1a2e",
    shineColor: cardTheme?.shineColor || "#d4af37",
    shineSpeed: cardTheme?.shineSpeed || 2,
  };

  // Animated shine effect
  const cardRef = useRef<HTMLDivElement>(null);
  const [shineIntensity, setShineIntensity] = useState(0.3);

  useEffect(() => {
    if (theme.shineSpeed <= 0) return;
    
    const duration = theme.shineSpeed * 1000;
    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      const intensity = 0.3 + Math.sin(progress * Math.PI * 2) * 0.15;
      setShineIntensity(intensity);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [theme.shineSpeed]);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Only show price for account and upload types (not link)
  const showPrice = functionType !== 'link' && product.price;

  // Show stock badge for account type products
  const showStockBadge = functionType === 'account' && stockCount !== null;
  const isOutOfStock = stockCount === 0;

  return (
    <>
      <div 
        ref={cardRef}
        className="product-frame rounded-lg p-2 sm:p-3 group transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        style={{
          backgroundColor: theme.bgColor,
          backgroundImage: theme.bgImageUrl ? `url(${theme.bgImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: theme.borderColor,
          boxShadow: `0 0 15px ${hexToRgba(theme.shineColor, shineIntensity)}, 0 0 30px ${hexToRgba(theme.shineColor, shineIntensity * 0.5)}, 0 6px 24px rgba(0,0,0,0.4)`,
        }}
        onClick={() => setDialogOpen(true)}
      >
        <div className="relative overflow-hidden rounded-md aspect-square mb-2 sm:mb-3 flex items-center justify-center bg-muted/20">
          <img 
            src={product.image} 
            alt={product.name}
            className="transition-transform duration-500 group-hover:scale-110"
            style={{
              objectFit: product.image_fit === "custom" ? "contain" : (product.image_fit as any) || "cover",
              width: product.image_fit === "custom" && product.image_custom_width ? `${product.image_custom_width}px` : "100%",
              height: product.image_fit === "custom" && product.image_custom_height ? `${product.image_custom_height}px` : "100%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Stock Badge for account products */}
          {showStockBadge && (
            <Badge 
              className={`absolute top-2 left-2 flex items-center gap-1 ${
                isOutOfStock 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-gold text-primary-foreground'
              }`}
            >
              <Package className="w-3 h-3" />
              {isOutOfStock ? 'Sold Out' : `${stockCount} left`}
            </Badge>
          )}

          {/* Favorite Button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FavoriteButton productId={product.id} />
          </div>
        </div>
        <div className="text-center space-y-0.5 sm:space-y-1">
          <h3 
            className="font-display font-semibold text-sm sm:text-lg truncate"
            style={{ color: theme.nameColor }}
          >
            {product.name}
          </h3>
          {showPrice && (
            <div 
              className="text-base sm:text-xl relative flex items-center justify-center px-1 sm:px-2"
              style={{ color: theme.priceColor }}
            >
              <span className="font-bold text-xs sm:text-base absolute left-1 sm:left-2">Price:</span>
              <span className="font-bold text-sm sm:text-base">{product.price}</span>
            </div>
          )}
        </div>
        
        {/* Add to Cart / Order Now Button */}
        <div className="mt-2 sm:mt-3">
          <AddToCartButton
            productId={product.id}
            orderUrl={product.order_url}
            categoryId={product.category_id}
            buttonStyle={{
              backgroundColor: theme.buttonBgColor,
              color: theme.buttonTextColor,
            }}
          />
        </div>
      </div>

      <ProductDetailDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dialogTheme={dialogTheme}
      />
    </>
  );
};
