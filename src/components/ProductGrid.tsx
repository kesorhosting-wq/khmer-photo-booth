import { ProductCard } from "./ProductCard";

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

interface ProductGridProps {
  products: Product[];
  onDeleteProduct?: (id: string) => void;
  cardTheme?: CardTheme;
  dialogTheme?: DialogTheme;
}

export const ProductGrid = ({ products, cardTheme, dialogTheme }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-xl font-display text-gold-light mb-2">No Products Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Products will appear here once added by admin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} cardTheme={cardTheme} dialogTheme={dialogTheme} />
      ))}
    </div>
  );
};
