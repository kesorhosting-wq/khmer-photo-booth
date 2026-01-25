import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { supabase } from "@/integrations/supabase/client";
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

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTheme?: DialogTheme;
}

export const ProductDetailDialog = ({
  product,
  open,
  onOpenChange,
  dialogTheme,
}: ProductDetailDialogProps) => {
  const [functionType, setFunctionType] = useState<CategoryFunction | null>(null);

  useEffect(() => {
    const fetchFunctionType = async () => {
      if (!product?.category_id) {
        setFunctionType('link');
        return;
      }
      const { data } = await supabase
        .from("categories")
        .select("function_type")
        .eq("id", product.category_id)
        .single();
      setFunctionType((data?.function_type as CategoryFunction) || 'link');
    };
    if (open && product) {
      fetchFunctionType();
    }
  }, [product?.category_id, open, product]);

  if (!product) return null;

  const handleSocialClick = (url: string | null | undefined) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const hasSocialLinks = product.facebook_url || product.tiktok_url || product.telegram_url;

  // Only show price for account and upload types
  const showPrice = functionType !== 'link' && product.price;

  const theme = {
    bgColor: dialogTheme?.bgColor || "#1a1a2e",
    bgImageUrl: dialogTheme?.bgImageUrl,
    borderColor: dialogTheme?.borderColor || "#d4af37",
    titleColor: dialogTheme?.titleColor || "#d4af37",
    priceColor: dialogTheme?.priceColor || "#d4af37",
    descriptionColor: dialogTheme?.descriptionColor || "#9ca3af",
    buttonBgColor: dialogTheme?.buttonBgColor || "#d4a574",
    buttonTextColor: dialogTheme?.buttonTextColor || "#1a1a2e",
    facebookIconColor: dialogTheme?.facebookIconColor || "#1877F2",
    tiktokIconColor: dialogTheme?.tiktokIconColor || "#000000",
    telegramIconColor: dialogTheme?.telegramIconColor || "#0088CC",
    closeIconColor: dialogTheme?.closeIconColor || "#ffffff",
    facebookIconUrl: dialogTheme?.facebookIconUrl,
    tiktokIconUrl: dialogTheme?.tiktokIconUrl,
    telegramIconUrl: dialogTheme?.telegramIconUrl,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md border-2 p-0 overflow-hidden"
        style={{
          backgroundColor: theme.bgColor,
          backgroundImage: theme.bgImageUrl ? `url(${theme.bgImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: theme.borderColor,
        }}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 rounded-full p-1 hover:opacity-80 transition-opacity"
          style={{ color: theme.closeIconColor }}
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader className="pt-6 px-6">
          <DialogTitle 
            className="font-display text-center text-xl"
            style={{ color: theme.titleColor }}
          >
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 px-6 pb-6">
          <div className="relative overflow-hidden rounded-lg aspect-square flex items-center justify-center bg-muted/20">
            <img
              src={product.image}
              alt={product.name}
              style={{
                objectFit: product.image_fit === "custom" ? "contain" : (product.image_fit as any) || "cover",
                width: product.image_fit === "custom" && product.image_custom_width ? `${product.image_custom_width}px` : "100%",
                height: product.image_fit === "custom" && product.image_custom_height ? `${product.image_custom_height}px` : "100%",
              }}
            />
          </div>

          {showPrice && (
            <p 
              className="font-bold text-2xl text-center"
              style={{ color: theme.priceColor }}
            >
              {product.price}
            </p>
          )}

          {product.description && (
            <p 
              className="text-sm text-center"
              style={{ color: theme.descriptionColor }}
            >
              {product.description}
            </p>
          )}

          {hasSocialLinks && (
            <div className="flex justify-center gap-4 pt-2">
              {product.facebook_url && (
                <button
                  onClick={() => handleSocialClick(product.facebook_url)}
                  className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
                  style={{ backgroundColor: theme.facebookIconUrl ? 'transparent' : theme.facebookIconColor }}
                  aria-label="Facebook"
                >
                  {theme.facebookIconUrl ? (
                    <img src={theme.facebookIconUrl} alt="Facebook" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                </button>
              )}
              
              {product.tiktok_url && (
                <button
                  onClick={() => handleSocialClick(product.tiktok_url)}
                  className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
                  style={{ backgroundColor: theme.tiktokIconUrl ? 'transparent' : theme.tiktokIconColor }}
                  aria-label="TikTok"
                >
                  {theme.tiktokIconUrl ? (
                    <img src={theme.tiktokIconUrl} alt="TikTok" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  )}
                </button>
              )}
              
              {product.telegram_url && (
                <button
                  onClick={() => handleSocialClick(product.telegram_url)}
                  className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
                  style={{ backgroundColor: theme.telegramIconUrl ? 'transparent' : theme.telegramIconColor }}
                  aria-label="Telegram"
                >
                  {theme.telegramIconUrl ? (
                    <img src={theme.telegramIconUrl} alt="Telegram" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          <AddToCartButton
            productId={product.id}
            orderUrl={product.order_url}
            categoryId={product.category_id}
            buttonStyle={{
              backgroundColor: theme.buttonBgColor,
              color: theme.buttonTextColor,
            }}
            className="py-3 text-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
