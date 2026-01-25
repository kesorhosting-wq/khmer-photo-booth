import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductGrid } from "@/components/ProductGrid";
import { DecorativeSection } from "@/components/DecorativeSection";
import { FestivalTheme, ColorMode, SnowEffect } from "@/components/FestivalThemeSwitcher";


import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import adminIcon from "@/assets/admin-icon.jpg";


interface Product {
  id: string;
  name: string;
  image: string;
  price?: string;
  description?: string;
  categoryIds: string[];
  facebook_url?: string | null;
  tiktok_url?: string | null;
  telegram_url?: string | null;
  order_url?: string | null;
  image_fit?: string | null;
  image_custom_width?: number | null;
  image_custom_height?: number | null;
}

interface SiteSettings {
  siteName: string;
  logo: string | null;
  logoWidth: number;
  logoHeight: number;
  logoPositionTop: number | null;
  logoPositionBottom: number | null;
  logoPositionLeft: number | null;
  logoPositionRight: number | null;
  headerBg: string;
  footerText: string;
  footerBgColor: string;
  footerTextColor: string;
  siteNameColor: string;
  siteNameFont: string;
  siteNameFontSize: number;
  categoryTextColor: string;
  categoryFont: string;
  categoryBgColor: string;
  categoryActiveBgColor: string;
  footerDescription: string;
  footerFacebookUrl: string | null;
  footerTiktokUrl: string | null;
  footerTelegramUrl: string | null;
  footerFacebookIconUrl: string | null;
  footerTiktokIconUrl: string | null;
  footerTelegramIconUrl: string | null;
  footerPaymentText: string;
  footerPaymentIconUrl: string | null;
  productCardBgColor: string;
  productCardBgImageUrl: string | null;
  productNameColor: string;
  productPriceColor: string;
  productDescriptionColor: string;
  productButtonBgColor: string;
  productButtonTextColor: string;
  productCardBorderColor: string;
  productCardShineColor: string;
  productCardShineSpeed: number;
  pageTitle: string;
  faviconUrl: string | null;
  bodyBgColor: string;
  bodyBgImageUrl: string | null;
  bodyTextColor: string;
  productsTitleColor: string;
  loadingImageUrl: string | null;
  // Dialog theme settings
  dialogBgColor: string;
  dialogBgImageUrl: string | null;
  dialogBorderColor: string;
  dialogTitleColor: string;
  dialogPriceColor: string;
  dialogDescriptionColor: string;
  dialogButtonBgColor: string;
  dialogButtonTextColor: string;
  dialogFacebookIconColor: string;
  dialogTiktokIconColor: string;
  dialogTelegramIconColor: string;
  dialogCloseIconColor: string;
  dialogFacebookIconUrl: string | null;
  dialogTiktokIconUrl: string | null;
  dialogTelegramIconUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

const Index = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "Angkor Handicraft",
    logo: null,
    logoWidth: 80,
    logoHeight: 80,
    logoPositionTop: 0,
    logoPositionBottom: null,
    logoPositionLeft: null,
    logoPositionRight: null,
    headerBg: "gradient",
    footerText: "© 2024 Angkor Handicraft. Preserving Khmer artistry.",
    footerBgColor: "#1a1a2e",
    footerTextColor: "#d4af37",
    siteNameColor: "#d4af37",
    siteNameFont: "Cinzel",
    siteNameFontSize: 48,
    categoryTextColor: "#ffffff",
    categoryFont: "Roboto",
    categoryBgColor: "#d4af37",
    categoryActiveBgColor: "#16a34a",
    footerDescription: "High-quality products with unique designs.",
    footerFacebookUrl: null,
    footerTiktokUrl: null,
    footerTelegramUrl: null,
    footerFacebookIconUrl: null,
    footerTiktokIconUrl: null,
    footerTelegramIconUrl: null,
    footerPaymentText: "Accept Payment",
    footerPaymentIconUrl: null,
    productCardBgColor: "#1a1a2e",
    productCardBgImageUrl: null,
    productNameColor: "#d4af37",
    productPriceColor: "#d4af37",
    productDescriptionColor: "#9ca3af",
    productButtonBgColor: "#d4a574",
    productButtonTextColor: "#1a1a2e",
    productCardBorderColor: "#d4af37",
    productCardShineColor: "#d4af37",
    productCardShineSpeed: 2,
    pageTitle: "Angkor Handicraft",
    faviconUrl: null,
    bodyBgColor: "#0d0d0d",
    bodyBgImageUrl: null,
    bodyTextColor: "#ffffff",
    productsTitleColor: "#d4af37",
    loadingImageUrl: null,
    // Dialog theme defaults
    dialogBgColor: "#1a1a2e",
    dialogBgImageUrl: null,
    dialogBorderColor: "#d4af37",
    dialogTitleColor: "#d4af37",
    dialogPriceColor: "#d4af37",
    dialogDescriptionColor: "#9ca3af",
    dialogButtonBgColor: "#d4a574",
    dialogButtonTextColor: "#1a1a2e",
    dialogFacebookIconColor: "#1877F2",
    dialogTiktokIconColor: "#000000",
    dialogTelegramIconColor: "#0088CC",
    dialogCloseIconColor: "#ffffff",
    dialogFacebookIconUrl: null,
    dialogTiktokIconUrl: null,
    dialogTelegramIconUrl: null,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [festivalTheme, setFestivalTheme] = useState<FestivalTheme>('none');
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [earlyLoadingData, setEarlyLoadingData] = useState<{
    loadingImageUrl: string | null;
    bodyBgColor: string;
  } | null>(null);

  // Apply page title, favicon, and loading screen immediately on mount (before full settings load)
  useEffect(() => {
    const applyEarlySettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("page_title, favicon_url, loading_image_url, body_bg_color")
        .maybeSingle();
      
      if (data) {
        // Apply page title
        if (data.page_title) {
          document.title = data.page_title;
        }
        // Apply favicon
        if (data.favicon_url) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = data.favicon_url;
          document.head.appendChild(link);
        }
        // Set early loading data for loading screen
        setEarlyLoadingData({
          loadingImageUrl: data.loading_image_url,
          bodyBgColor: data.body_bg_color || "#0d0d0d",
        });
      } else {
        setEarlyLoadingData({ loadingImageUrl: null, bodyBgColor: "#0d0d0d" });
      }
    };
    applyEarlySettings();

    // Minimum loading time of 2 seconds for better UX
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchSiteSettings();
    fetchCategories();
  }, []);

  const fetchSiteSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .maybeSingle();

    if (data) {
      setSettings({
        siteName: data.site_name || "Angkor Handicraft",
        logo: data.logo_url,
        logoWidth: data.logo_width || 80,
        logoHeight: data.logo_height || 80,
        logoPositionTop: data.logo_position_top ?? 0,
        logoPositionBottom: data.logo_position_bottom ?? null,
        logoPositionLeft: data.logo_position_left ?? null,
        logoPositionRight: data.logo_position_right ?? null,
        headerBg: data.header_bg_url || "gradient",
        footerText: data.footer_text || "© 2024 Angkor Handicraft.",
        footerBgColor: data.footer_bg_color || "#1a1a2e",
        footerTextColor: data.footer_text_color || "#d4af37",
        siteNameColor: data.site_name_color || "#d4af37",
        siteNameFont: data.site_name_font || "Cinzel",
        siteNameFontSize: data.site_name_font_size || 48,
        categoryTextColor: data.category_text_color || "#ffffff",
        categoryFont: data.category_font || "Roboto",
        categoryBgColor: data.category_bg_color || "#d4af37",
        categoryActiveBgColor: data.category_active_bg_color || "#16a34a",
        footerDescription: data.footer_description || "High-quality products with unique designs.",
        footerFacebookUrl: data.footer_facebook_url,
        footerTiktokUrl: data.footer_tiktok_url,
        footerTelegramUrl: data.footer_telegram_url,
        footerFacebookIconUrl: data.footer_facebook_icon_url,
        footerTiktokIconUrl: data.footer_tiktok_icon_url,
        footerTelegramIconUrl: data.footer_telegram_icon_url,
        footerPaymentText: data.footer_payment_text || "Accept Payment",
        footerPaymentIconUrl: data.footer_payment_icon_url,
        productCardBgColor: data.product_card_bg_color || "#1a1a2e",
        productCardBgImageUrl: data.product_card_bg_image_url,
        productNameColor: data.product_name_color || "#d4af37",
        productPriceColor: data.product_price_color || "#d4af37",
        productDescriptionColor: data.product_description_color || "#9ca3af",
        productButtonBgColor: data.product_button_bg_color || "#d4a574",
        productButtonTextColor: data.product_button_text_color || "#1a1a2e",
        productCardBorderColor: data.product_card_border_color || "#d4af37",
        productCardShineColor: data.product_card_shine_color || "#d4af37",
        productCardShineSpeed: data.product_card_shine_speed || 2,
        pageTitle: data.page_title || "Angkor Handicraft",
        faviconUrl: data.favicon_url,
        bodyBgColor: data.body_bg_color || "#0d0d0d",
        bodyBgImageUrl: data.body_bg_image_url,
        bodyTextColor: data.body_text_color || "#ffffff",
        productsTitleColor: data.products_title_color || "#d4af37",
        loadingImageUrl: data.loading_image_url,
        // Dialog theme settings
        dialogBgColor: (data as any).dialog_bg_color || "#1a1a2e",
        dialogBgImageUrl: (data as any).dialog_bg_image_url,
        dialogBorderColor: (data as any).dialog_border_color || "#d4af37",
        dialogTitleColor: (data as any).dialog_title_color || "#d4af37",
        dialogPriceColor: (data as any).dialog_price_color || "#d4af37",
        dialogDescriptionColor: (data as any).dialog_description_color || "#9ca3af",
        dialogButtonBgColor: (data as any).dialog_button_bg_color || "#d4a574",
        dialogButtonTextColor: (data as any).dialog_button_text_color || "#1a1a2e",
        dialogFacebookIconColor: (data as any).dialog_facebook_icon_color || "#1877F2",
        dialogTiktokIconColor: (data as any).dialog_tiktok_icon_color || "#000000",
        dialogTelegramIconColor: (data as any).dialog_telegram_icon_color || "#0088CC",
        dialogCloseIconColor: (data as any).dialog_close_icon_color || "#ffffff",
        dialogFacebookIconUrl: (data as any).dialog_facebook_icon_url,
        dialogTiktokIconUrl: (data as any).dialog_tiktok_icon_url,
        dialogTelegramIconUrl: (data as any).dialog_telegram_icon_url,
      });
    }
    setSettingsLoaded(true);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch product categories
    const { data: productCatsData } = await supabase
      .from("product_categories")
      .select("product_id, category_id");

    if (productsError) {
      console.error("Error fetching products:", productsError);
    } else {
      const mappedProducts = (productsData || []).map((p) => {
        // Get all category IDs for this product from junction table
        const productCategoryIds = (productCatsData || [])
          .filter(pc => pc.product_id === p.id)
          .map(pc => pc.category_id);
        
        // If no entries in junction table, fall back to legacy category_id
        const categoryIds = productCategoryIds.length > 0 
          ? productCategoryIds 
          : (p.category_id ? [p.category_id] : []);

        return {
          id: p.id,
          name: p.name,
          image: p.image_url,
          price: p.price || undefined,
          description: p.description || undefined,
          categoryIds,
          facebook_url: p.facebook_url,
          tiktok_url: p.tiktok_url,
          telegram_url: p.telegram_url,
          order_url: p.order_url,
          image_fit: p.image_fit,
          image_custom_width: p.image_custom_width,
          image_custom_height: p.image_custom_height,
        };
      });
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  const handleSettingsChange = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    toast.success("Settings updated successfully!");
  };

  // Filter products by selected category (now checks if product has that category)
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.categoryIds.includes(selectedCategory))
    : products;

  // Show full loading screen while loading - use earlyLoadingData for immediate display
  const loadingBgColor = earlyLoadingData?.bodyBgColor || settings.bodyBgColor || "#0d0d0d";
  const loadingImage = earlyLoadingData?.loadingImageUrl || settings.loadingImageUrl;

  // Show loading screen until all conditions are met: settings loaded, data loaded, and minimum time passed
  const showLoading = !settingsLoaded || !minLoadingComplete || loading;

  // While earlyLoadingData is null (still fetching), show nothing to avoid dark flash
  if (earlyLoadingData === null) {
    return null;
  }

  if (showLoading) {
    // If we have a loading image, show it
    if (loadingImage) {
      return (
        <div 
          className="fixed inset-0 z-50 w-screen h-screen"
          style={{ backgroundColor: loadingBgColor }}
        >
          <img 
            src={loadingImage} 
            alt="Loading" 
            className="w-full h-full object-cover object-center"
            style={{ 
              minWidth: '100vw', 
              minHeight: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh'
            }}
          />
        </div>
      );
    }
    // If no loading image, show background color only
    return (
      <div 
        className="fixed inset-0 z-50"
        style={{ backgroundColor: loadingBgColor }}
      />
    );
  }

  // Get festival theme class
  const getThemeClass = () => {
    switch (festivalTheme) {
      case 'christmas': return 'theme-christmas';
      default: return '';
    }
  };

  return (
    <div 
      className={`min-h-screen ${getThemeClass()} ${colorMode === 'light' ? 'light-mode' : ''}`}
      style={{
        backgroundColor: colorMode === 'light' ? '#faf5ef' : settings.bodyBgColor,
        backgroundImage: colorMode === 'light' ? undefined : (settings.bodyBgImageUrl ? `url(${settings.bodyBgImageUrl})` : undefined),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: colorMode === 'light' ? '#2d1810' : settings.bodyTextColor,
      }}
    >
      {/* Festival Theme Effects */}
      {festivalTheme === 'christmas' && <SnowEffect />}

      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <SiteHeader
        siteName={settings.siteName}
        logo={settings.logo}
        logoWidth={settings.logoWidth}
        logoHeight={settings.logoHeight}
        logoPositionTop={settings.logoPositionTop}
        logoPositionBottom={settings.logoPositionBottom}
        logoPositionLeft={settings.logoPositionLeft}
        logoPositionRight={settings.logoPositionRight}
        headerBg={settings.headerBg}
        siteNameColor={settings.siteNameColor}
        siteNameFont={settings.siteNameFont}
        siteNameFontSize={settings.siteNameFontSize}
        onSettingsChange={handleSettingsChange}
        festivalTheme={festivalTheme}
        onFestivalThemeChange={setFestivalTheme}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
      />


      {/* Decorative Divider */}
      <DecorativeSection />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 pb-8 sm:pb-12">
        {/* Section Title */}
        <div className="text-center mb-4 sm:mb-8">
          <h2 
            className="text-xl sm:text-2xl md:text-3xl font-display mb-1 sm:mb-2"
            style={{ color: settings.productsTitleColor }}
          >
            ផលិតផលរបស់យើង
          </h2>
          <p style={{ color: settings.productsTitleColor, opacity: 0.8 }} className="font-khmer text-sm sm:text-base">Our Products</p>
        </div>

        {/* Category Filter Buttons */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-8 px-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all"
              style={{ 
                backgroundColor: selectedCategory === null ? settings.categoryActiveBgColor : settings.categoryBgColor,
                color: settings.categoryTextColor,
                fontFamily: settings.categoryFont,
                border: `1px solid ${settings.categoryBgColor}`
              }}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all"
                style={{ 
                  backgroundColor: selectedCategory === category.id ? settings.categoryActiveBgColor : settings.categoryBgColor,
                  color: settings.categoryTextColor,
                  fontFamily: settings.categoryFont,
                  border: `1px solid ${settings.categoryBgColor}`
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Featured Frame Area */}
        <div className="khmer-border p-2 sm:p-4 md:p-8 mb-4 sm:mb-8 relative overflow-hidden">
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-4 h-4 sm:w-8 sm:h-8 border-t-2 border-l-2 border-gold/50" />
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-8 sm:h-8 border-t-2 border-r-2 border-gold/50" />
          <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-4 h-4 sm:w-8 sm:h-8 border-b-2 border-l-2 border-gold/50" />
          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-8 sm:h-8 border-b-2 border-r-2 border-gold/50" />
          
          {loading ? (
            <div className="py-12" />
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              onDeleteProduct={() => {}}
              cardTheme={{
                bgColor: settings.productCardBgColor,
                bgImageUrl: settings.productCardBgImageUrl,
                borderColor: settings.productCardBorderColor,
                nameColor: settings.productNameColor,
                priceColor: settings.productPriceColor,
                descriptionColor: settings.productDescriptionColor,
                buttonBgColor: settings.productButtonBgColor,
                buttonTextColor: settings.productButtonTextColor,
                shineColor: settings.productCardShineColor,
                shineSpeed: settings.productCardShineSpeed,
              }}
              dialogTheme={{
                bgColor: settings.dialogBgColor,
                bgImageUrl: settings.dialogBgImageUrl,
                borderColor: settings.dialogBorderColor,
                titleColor: settings.dialogTitleColor,
                priceColor: settings.dialogPriceColor,
                descriptionColor: settings.dialogDescriptionColor,
                buttonBgColor: settings.dialogButtonBgColor,
                buttonTextColor: settings.dialogButtonTextColor,
                facebookIconColor: settings.dialogFacebookIconColor,
                tiktokIconColor: settings.dialogTiktokIconColor,
                telegramIconColor: settings.dialogTelegramIconColor,
                closeIconColor: settings.dialogCloseIconColor,
                facebookIconUrl: settings.dialogFacebookIconUrl,
                tiktokIconUrl: settings.dialogTiktokIconUrl,
                telegramIconUrl: settings.dialogTelegramIconUrl,
              }}
            />
          )}
        </div>

      </main>

      {/* Admin Link */}
      <a 
        href="/auth" 
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg hover:scale-110 transition-transform overflow-hidden border-2 border-pink-300 z-40"
        title="Admin Login"
      >
        <img src={adminIcon} alt="Admin" className="w-full h-full object-cover" />
      </a>

      {/* Footer */}
      <SiteFooter settings={settings} categories={categories} />
    </div>
  );
};

export default Index;
