import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { Home, ImagePlus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

// Popular Google Fonts for selection
const FONT_OPTIONS = [
  { name: "Cinzel", family: "Cinzel, serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Roboto", family: "Roboto, sans-serif" },
  { name: "Open Sans", family: "'Open Sans', sans-serif" },
  { name: "Lato", family: "Lato, sans-serif" },
  { name: "Montserrat", family: "Montserrat, sans-serif" },
  { name: "Poppins", family: "Poppins, sans-serif" },
  { name: "Raleway", family: "Raleway, sans-serif" },
  { name: "Oswald", family: "Oswald, sans-serif" },
  { name: "Merriweather", family: "Merriweather, serif" },
  { name: "Dancing Script", family: "'Dancing Script', cursive" },
  { name: "Pacifico", family: "Pacifico, cursive" },
  { name: "Great Vibes", family: "'Great Vibes', cursive" },
  { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif" },
  { name: "Crimson Text", family: "'Crimson Text', serif" },
];

interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  logo_width: number | null;
  logo_height: number | null;
  logo_position_top: number | null;
  logo_position_bottom: number | null;
  logo_position_left: number | null;
  logo_position_right: number | null;
  header_bg_url: string | null;
  footer_text: string;
  footer_bg_color: string;
  footer_text_color: string;
  site_name_color: string;
  site_name_font: string;
  site_name_font_size: number | null;
  category_text_color: string;
  category_font: string;
  category_bg_color: string;
  category_active_bg_color: string;
  footer_description: string | null;
  footer_facebook_url: string | null;
  footer_tiktok_url: string | null;
  footer_telegram_url: string | null;
  footer_facebook_icon_url: string | null;
  footer_tiktok_icon_url: string | null;
  footer_telegram_icon_url: string | null;
  footer_payment_text: string | null;
  footer_payment_icon_url: string | null;
  product_card_bg_color: string | null;
  product_card_bg_image_url: string | null;
  product_name_color: string | null;
  product_price_color: string | null;
  product_description_color: string | null;
  product_button_bg_color: string | null;
  product_button_text_color: string | null;
  product_card_border_color: string | null;
  product_card_shine_color: string | null;
  product_card_shine_speed: number | null;
  page_title: string | null;
  favicon_url: string | null;
  body_bg_color: string | null;
  body_bg_image_url: string | null;
  body_text_color: string | null;
  products_title_color: string | null;
  loading_image_url: string | null;
  // Dialog theme
  dialog_bg_color?: string | null;
  dialog_bg_image_url?: string | null;
  dialog_border_color?: string | null;
  dialog_title_color?: string | null;
  dialog_price_color?: string | null;
  dialog_description_color?: string | null;
  dialog_button_bg_color?: string | null;
  dialog_button_text_color?: string | null;
  dialog_facebook_icon_color?: string | null;
  dialog_tiktok_icon_color?: string | null;
  dialog_telegram_icon_color?: string | null;
  dialog_close_icon_color?: string | null;
}

export const HomeEditDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // Form state
  const [siteName, setSiteName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoWidth, setLogoWidth] = useState(80);
  const [logoHeight, setLogoHeight] = useState(80);
  const [logoPositionTop, setLogoPositionTop] = useState<number | null>(0);
  const [logoPositionBottom, setLogoPositionBottom] = useState<number | null>(null);
  const [logoPositionLeft, setLogoPositionLeft] = useState<number | null>(null);
  const [logoPositionRight, setLogoPositionRight] = useState<number | null>(null);
  const [headerBgPreview, setHeaderBgPreview] = useState<string | null>(null);
  const [footerText, setFooterText] = useState("");
  const [footerBgColor, setFooterBgColor] = useState("#1a1a2e");
  const [footerTextColor, setFooterTextColor] = useState("#d4af37");
  const [siteNameColor, setSiteNameColor] = useState("#d4af37");
  const [siteNameFont, setSiteNameFont] = useState("Cinzel");
  const [siteNameFontSize, setSiteNameFontSize] = useState(48);
  const [categoryTextColor, setCategoryTextColor] = useState("#ffffff");
  const [categoryFont, setCategoryFont] = useState("Roboto");
  const [categoryBgColor, setCategoryBgColor] = useState("#d4af37");
  const [categoryActiveBgColor, setCategoryActiveBgColor] = useState("#16a34a");
  const [footerDescription, setFooterDescription] = useState("High-quality products with unique designs.");
  const [footerFacebookUrl, setFooterFacebookUrl] = useState("");
  const [footerTiktokUrl, setFooterTiktokUrl] = useState("");
  const [footerTelegramUrl, setFooterTelegramUrl] = useState("");
  const [footerFacebookIconPreview, setFooterFacebookIconPreview] = useState<string | null>(null);
  const [footerTiktokIconPreview, setFooterTiktokIconPreview] = useState<string | null>(null);
  const [footerTelegramIconPreview, setFooterTelegramIconPreview] = useState<string | null>(null);
  const [footerPaymentText, setFooterPaymentText] = useState("Accept Payment");
  const [footerPaymentIconPreview, setFooterPaymentIconPreview] = useState<string | null>(null);
  
  // Product Card Theme
  const [productCardBgColor, setProductCardBgColor] = useState("#1a1a2e");
  const [productCardBgImagePreview, setProductCardBgImagePreview] = useState<string | null>(null);
  const [productNameColor, setProductNameColor] = useState("#d4af37");
  const [productPriceColor, setProductPriceColor] = useState("#d4af37");
  const [productDescriptionColor, setProductDescriptionColor] = useState("#9ca3af");
  const [productButtonBgColor, setProductButtonBgColor] = useState("#d4a574");
  const [productButtonTextColor, setProductButtonTextColor] = useState("#1a1a2e");
  const [productCardBorderColor, setProductCardBorderColor] = useState("#d4af37");
  const [productCardShineColor, setProductCardShineColor] = useState("#d4af37");
  const [productCardShineSpeed, setProductCardShineSpeed] = useState(2);
  
  // Browser Tab Settings
  const [pageTitle, setPageTitle] = useState("Pinkkaa");
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  // Body Background Settings
  const [bodyBgColor, setBodyBgColor] = useState("#0d0d0d");
  const [bodyBgImagePreview, setBodyBgImagePreview] = useState<string | null>(null);
  const [bodyTextColor, setBodyTextColor] = useState("#ffffff");
  
  // Products Section Title
  const [productsTitleColor, setProductsTitleColor] = useState("#d4af37");
  
  // Loading/Reload Image
  const [loadingImagePreview, setLoadingImagePreview] = useState<string | null>(null);
  
  // Dialog Theme Settings
  const [dialogBgColor, setDialogBgColor] = useState("#1a1a2e");
  const [dialogBgImagePreview, setDialogBgImagePreview] = useState<string | null>(null);
  const [dialogBorderColor, setDialogBorderColor] = useState("#d4af37");
  const [dialogTitleColor, setDialogTitleColor] = useState("#d4af37");
  const [dialogPriceColor, setDialogPriceColor] = useState("#d4af37");
  const [dialogDescriptionColor, setDialogDescriptionColor] = useState("#9ca3af");
  const [dialogButtonBgColor, setDialogButtonBgColor] = useState("#d4a574");
  const [dialogButtonTextColor, setDialogButtonTextColor] = useState("#1a1a2e");
  const [dialogFacebookIconColor, setDialogFacebookIconColor] = useState("#1877F2");
  const [dialogTiktokIconColor, setDialogTiktokIconColor] = useState("#000000");
  const [dialogTelegramIconColor, setDialogTelegramIconColor] = useState("#0088CC");
  const [dialogCloseIconColor, setDialogCloseIconColor] = useState("#ffffff");
  const [dialogFacebookIconPreview, setDialogFacebookIconPreview] = useState<string | null>(null);
  const [dialogTiktokIconPreview, setDialogTiktokIconPreview] = useState<string | null>(null);
  const [dialogTelegramIconPreview, setDialogTelegramIconPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .maybeSingle();

    if (data) {
      setSettings(data);
      setSiteName(data.site_name || "");
      setLogoPreview(data.logo_url);
      setLogoWidth(data.logo_width || 80);
      setLogoHeight(data.logo_height || 80);
      setLogoPositionTop(data.logo_position_top ?? 0);
      setLogoPositionBottom(data.logo_position_bottom ?? null);
      setLogoPositionLeft(data.logo_position_left ?? null);
      setLogoPositionRight(data.logo_position_right ?? null);
      setHeaderBgPreview(data.header_bg_url);
      setFooterText(data.footer_text || "");
      setFooterBgColor(data.footer_bg_color || "#1a1a2e");
      setFooterTextColor(data.footer_text_color || "#d4af37");
      setSiteNameColor(data.site_name_color || "#d4af37");
      setSiteNameFont(data.site_name_font || "Cinzel");
      setSiteNameFontSize(data.site_name_font_size || 48);
      setCategoryTextColor(data.category_text_color || "#ffffff");
      setCategoryFont(data.category_font || "Roboto");
      setCategoryBgColor(data.category_bg_color || "#d4af37");
      setCategoryActiveBgColor(data.category_active_bg_color || "#16a34a");
      setFooterDescription(data.footer_description || "High-quality products with unique designs.");
      setFooterFacebookUrl(data.footer_facebook_url || "");
      setFooterTiktokUrl(data.footer_tiktok_url || "");
      setFooterTelegramUrl(data.footer_telegram_url || "");
      setFooterFacebookIconPreview(data.footer_facebook_icon_url);
      setFooterTiktokIconPreview(data.footer_tiktok_icon_url);
      setFooterTelegramIconPreview(data.footer_telegram_icon_url);
      setFooterPaymentText(data.footer_payment_text || "Accept Payment");
      setFooterPaymentIconPreview(data.footer_payment_icon_url);
      // Product card theme
      setProductCardBgColor(data.product_card_bg_color || "#1a1a2e");
      setProductCardBgImagePreview(data.product_card_bg_image_url);
      setProductNameColor(data.product_name_color || "#d4af37");
      setProductPriceColor(data.product_price_color || "#d4af37");
      setProductDescriptionColor(data.product_description_color || "#9ca3af");
      setProductButtonBgColor(data.product_button_bg_color || "#d4a574");
      setProductButtonTextColor(data.product_button_text_color || "#1a1a2e");
      setProductCardBorderColor(data.product_card_border_color || "#d4af37");
      setProductCardShineColor(data.product_card_shine_color || "#d4af37");
      setProductCardShineSpeed(data.product_card_shine_speed || 2);
      // Browser tab settings
      setPageTitle(data.page_title || "Angkor Handicraft");
      setFaviconPreview(data.favicon_url);
      // Body background settings
      setBodyBgColor(data.body_bg_color || "#0d0d0d");
      setBodyBgImagePreview(data.body_bg_image_url);
      setBodyTextColor(data.body_text_color || "#ffffff");
      // Products section title
      setProductsTitleColor(data.products_title_color || "#d4af37");
      // Loading/Reload image
      setLoadingImagePreview(data.loading_image_url);
      // Dialog theme
      setDialogBgColor((data as any).dialog_bg_color || "#1a1a2e");
      setDialogBgImagePreview((data as any).dialog_bg_image_url);
      setDialogBorderColor((data as any).dialog_border_color || "#d4af37");
      setDialogTitleColor((data as any).dialog_title_color || "#d4af37");
      setDialogPriceColor((data as any).dialog_price_color || "#d4af37");
      setDialogDescriptionColor((data as any).dialog_description_color || "#9ca3af");
      setDialogButtonBgColor((data as any).dialog_button_bg_color || "#d4a574");
      setDialogButtonTextColor((data as any).dialog_button_text_color || "#1a1a2e");
      setDialogFacebookIconColor((data as any).dialog_facebook_icon_color || "#1877F2");
      setDialogTiktokIconColor((data as any).dialog_tiktok_icon_color || "#000000");
      setDialogTelegramIconColor((data as any).dialog_telegram_icon_color || "#0088CC");
      setDialogCloseIconColor((data as any).dialog_close_icon_color || "#ffffff");
      setDialogFacebookIconPreview((data as any).dialog_facebook_icon_url);
      setDialogTiktokIconPreview((data as any).dialog_tiktok_icon_url);
      setDialogTelegramIconPreview((data as any).dialog_telegram_icon_url);
    }
    setLoading(false);
  };

  // Store pending files for upload on save
  const pendingFiles = useRef<Map<string, File>>(new Map());

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void,
    fileKey: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      pendingFiles.current.set(fileKey, file);
      const url = URL.createObjectURL(file);
      setter(url);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (settings?.id) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            site_name: siteName,
            logo_url: logoPreview,
            logo_width: logoWidth,
            logo_height: logoHeight,
            logo_position_top: logoPositionTop,
            logo_position_bottom: logoPositionBottom,
            logo_position_left: logoPositionLeft,
            logo_position_right: logoPositionRight,
            header_bg_url: headerBgPreview,
            footer_text: footerText,
            footer_bg_color: footerBgColor,
            footer_text_color: footerTextColor,
            site_name_color: siteNameColor,
            site_name_font: siteNameFont,
            site_name_font_size: siteNameFontSize,
            category_text_color: categoryTextColor,
            category_font: categoryFont,
            category_bg_color: categoryBgColor,
            category_active_bg_color: categoryActiveBgColor,
            footer_description: footerDescription,
            footer_facebook_url: footerFacebookUrl || null,
            footer_tiktok_url: footerTiktokUrl || null,
            footer_telegram_url: footerTelegramUrl || null,
            footer_facebook_icon_url: footerFacebookIconPreview,
            footer_tiktok_icon_url: footerTiktokIconPreview,
            footer_telegram_icon_url: footerTelegramIconPreview,
            footer_payment_text: footerPaymentText,
            footer_payment_icon_url: footerPaymentIconPreview,
            product_card_bg_color: productCardBgColor,
            product_card_bg_image_url: productCardBgImagePreview,
            product_name_color: productNameColor,
            product_price_color: productPriceColor,
            product_description_color: productDescriptionColor,
            product_button_bg_color: productButtonBgColor,
            product_button_text_color: productButtonTextColor,
            product_card_border_color: productCardBorderColor,
            product_card_shine_color: productCardShineColor,
            product_card_shine_speed: productCardShineSpeed,
            page_title: pageTitle,
            favicon_url: faviconPreview,
            body_bg_color: bodyBgColor,
            body_bg_image_url: bodyBgImagePreview,
            body_text_color: bodyTextColor,
            products_title_color: productsTitleColor,
            loading_image_url: loadingImagePreview,
            dialog_bg_color: dialogBgColor,
            dialog_bg_image_url: dialogBgImagePreview,
            dialog_border_color: dialogBorderColor,
            dialog_title_color: dialogTitleColor,
            dialog_price_color: dialogPriceColor,
            dialog_description_color: dialogDescriptionColor,
            dialog_button_bg_color: dialogButtonBgColor,
            dialog_button_text_color: dialogButtonTextColor,
            dialog_facebook_icon_color: dialogFacebookIconColor,
            dialog_tiktok_icon_color: dialogTiktokIconColor,
            dialog_telegram_icon_color: dialogTelegramIconColor,
            dialog_close_icon_color: dialogCloseIconColor,
            dialog_facebook_icon_url: dialogFacebookIconPreview,
            dialog_tiktok_icon_url: dialogTiktokIconPreview,
            dialog_telegram_icon_url: dialogTelegramIconPreview,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({
            site_name: siteName,
            logo_url: logoPreview,
            logo_width: logoWidth,
            logo_height: logoHeight,
            logo_position_top: logoPositionTop,
            logo_position_bottom: logoPositionBottom,
            logo_position_left: logoPositionLeft,
            logo_position_right: logoPositionRight,
            header_bg_url: headerBgPreview,
            footer_text: footerText,
            footer_bg_color: footerBgColor,
            footer_text_color: footerTextColor,
            site_name_color: siteNameColor,
            site_name_font: siteNameFont,
            site_name_font_size: siteNameFontSize,
            category_text_color: categoryTextColor,
            category_font: categoryFont,
            category_bg_color: categoryBgColor,
            category_active_bg_color: categoryActiveBgColor,
            footer_description: footerDescription,
            footer_facebook_url: footerFacebookUrl || null,
            footer_tiktok_url: footerTiktokUrl || null,
            footer_telegram_url: footerTelegramUrl || null,
            footer_facebook_icon_url: footerFacebookIconPreview,
            footer_tiktok_icon_url: footerTiktokIconPreview,
            footer_telegram_icon_url: footerTelegramIconPreview,
            footer_payment_text: footerPaymentText,
            footer_payment_icon_url: footerPaymentIconPreview,
            product_card_bg_color: productCardBgColor,
            product_card_bg_image_url: productCardBgImagePreview,
            product_name_color: productNameColor,
            product_price_color: productPriceColor,
            product_description_color: productDescriptionColor,
            product_button_bg_color: productButtonBgColor,
            product_button_text_color: productButtonTextColor,
            product_card_border_color: productCardBorderColor,
            product_card_shine_color: productCardShineColor,
            product_card_shine_speed: productCardShineSpeed,
            page_title: pageTitle,
            favicon_url: faviconPreview,
            body_bg_color: bodyBgColor,
            body_bg_image_url: bodyBgImagePreview,
            body_text_color: bodyTextColor,
            products_title_color: productsTitleColor,
            loading_image_url: loadingImagePreview,
            dialog_bg_color: dialogBgColor,
            dialog_bg_image_url: dialogBgImagePreview,
            dialog_border_color: dialogBorderColor,
            dialog_title_color: dialogTitleColor,
            dialog_price_color: dialogPriceColor,
            dialog_description_color: dialogDescriptionColor,
            dialog_button_bg_color: dialogButtonBgColor,
            dialog_button_text_color: dialogButtonTextColor,
            dialog_facebook_icon_color: dialogFacebookIconColor,
            dialog_tiktok_icon_color: dialogTiktokIconColor,
            dialog_telegram_icon_color: dialogTelegramIconColor,
            dialog_close_icon_color: dialogCloseIconColor,
            dialog_facebook_icon_url: dialogFacebookIconPreview,
            dialog_tiktok_icon_url: dialogTiktokIconPreview,
            dialog_telegram_icon_url: dialogTelegramIconPreview,
          });

        if (error) throw error;
      }

      toast.success("Homepage settings saved!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold/80 text-primary-foreground hover:bg-gold font-display gap-2">
          <Home className="w-4 h-4" />
          Home Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display">
            Edit Homepage
          </DialogTitle>
        </DialogHeader>
        
        {loading && !settings ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Browser Tab Settings Section */}
            <div className="border-b border-gold/20 pb-4 mb-4">
              <h3 className="text-foreground font-medium mb-4">Browser Tab Settings</h3>
              
              {/* Page Title */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Page Title (Browser Tab)</Label>
                <Input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Your page title"
                  className="bg-input border-gold/30 text-foreground"
                />
                <p className="text-xs text-muted-foreground">This appears in the browser tab</p>
              </div>
              
              {/* Favicon Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Favicon (Tab Icon)</Label>
                {faviconPreview ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain bg-background" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFaviconPreview(null)}
                      className="absolute top-0 right-0 bg-background/80 text-foreground h-5 text-xs px-1"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-5 h-5 text-gold/50" />
                    <span className="text-muted-foreground text-[10px] mt-1">Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setFaviconPreview)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Recommended: 32x32 or 64x64 pixels</p>
              </div>
            </div>

            {/* Reload/Loading Image Section */}
            <div className="border-b border-gold/20 pb-4 mb-4">
              <h3 className="text-foreground font-medium mb-4">Reload Edit (Loading Image)</h3>
              <p className="text-xs text-muted-foreground mb-3">This image/GIF will show when the page is loading</p>
              
              <div className="space-y-2">
                <Label className="text-foreground">Loading Image</Label>
                {loadingImagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={loadingImagePreview} alt="Loading" className="w-full h-full object-contain bg-background" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLoadingImagePreview(null)}
                      className="absolute top-0 right-0 bg-background/80 text-foreground h-5 text-xs px-1"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-6 h-6 text-gold/50" />
                    <span className="text-muted-foreground text-xs mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setLoadingImagePreview)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Supports GIFs for animated loading</p>
              </div>
            </div>

            {/* Body Background Settings Section */}
            <div className="border-b border-gold/20 pb-4 mb-4">
              <h3 className="text-foreground font-medium mb-4">Body Background Settings</h3>
              
              {/* Body Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bodyBgColor}
                    onChange={(e) => setBodyBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={bodyBgColor}
                    onChange={(e) => setBodyBgColor(e.target.value)}
                    placeholder="#0d0d0d"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used when no background image is set</p>
              </div>
              
              {/* Body Background Image */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Background Image (Optional)</Label>
                {bodyBgImagePreview ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={bodyBgImagePreview} alt="Body BG" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBodyBgImagePreview(null)}
                      className="absolute top-2 right-2 bg-background/80 text-foreground"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-8 h-8 text-gold/50 mb-1" />
                    <span className="text-muted-foreground text-sm">Upload background image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setBodyBgImagePreview)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Leave empty to use background color only</p>
              </div>
              
              {/* Body Text Color */}
              <div className="space-y-2">
                <Label className="text-foreground">Body Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Site Name */}
            <div className="space-y-2">
              <Label className="text-foreground">Site Name</Label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Your site name"
                className="bg-input border-gold/30 text-foreground"
                style={{ fontFamily: siteNameFont, color: siteNameColor }}
              />
            </div>

            {/* Site Name Color */}
            <div className="space-y-2">
              <Label className="text-foreground">Site Name Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={siteNameColor}
                  onChange={(e) => setSiteNameColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                />
                <Input
                  value={siteNameColor}
                  onChange={(e) => setSiteNameColor(e.target.value)}
                  placeholder="#d4af37"
                  className="bg-input border-gold/30 text-foreground flex-1"
                />
              </div>
            </div>

            {/* Site Name Font */}
            <div className="space-y-2">
              <Label className="text-foreground">Site Name Font</Label>
              <select
                value={siteNameFont}
                onChange={(e) => setSiteNameFont(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gold/30 bg-input text-foreground"
                style={{ fontFamily: siteNameFont }}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>
                    {font.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Preview: <span style={{ fontFamily: siteNameFont, fontSize: siteNameFontSize }}>{siteName || "Sample Text"}</span></p>
            </div>

            {/* Site Name Font Size */}
            <div className="space-y-2">
              <Label className="text-foreground">Site Name Font Size (px)</Label>
              <Input
                type="number"
                value={siteNameFontSize}
                onChange={(e) => setSiteNameFontSize(Number(e.target.value))}
                min={12}
                max={120}
                className="bg-input border-gold/30 text-foreground"
              />
            </div>

            {/* Logo Settings Section */}
            <div className="border-b border-gold/20 pb-4 mb-4 mt-4">
              <h3 className="text-foreground font-medium mb-4 text-gold">🎀 Logo Settings</h3>
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Logo Image</Label>
              <div className="flex items-center gap-3">
                {logoPreview && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gold/30 bg-background">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 border border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-4 h-4 text-gold/50" />
                    <span className="text-foreground text-sm">{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*,.gif"
                      onChange={(e) => handleImageUpload(e, setLogoPreview)}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogoPreview(null)}
                      className="text-destructive hover:text-destructive/80 text-xs h-7"
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Size */}
            <div className="space-y-2">
              <Label className="text-foreground">Logo Size</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Width (px)</Label>
                  <Input
                    type="number"
                    value={logoWidth}
                    onChange={(e) => setLogoWidth(Number(e.target.value))}
                    min={20}
                    max={300}
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height (px)</Label>
                  <Input
                    type="number"
                    value={logoHeight}
                    onChange={(e) => setLogoHeight(Number(e.target.value))}
                    min={20}
                    max={300}
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
              </div>
              {logoPreview && (
                <div className="mt-2 p-2 border border-gold/20 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    style={{ width: logoWidth, height: logoHeight }}
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Logo Position */}
            <div className="space-y-2">
              <Label className="text-foreground">Logo Position (px)</Label>
              <p className="text-xs text-muted-foreground mb-2">Leave empty for default centered position</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Top</Label>
                  <Input
                    type="number"
                    value={logoPositionTop ?? ''}
                    onChange={(e) => setLogoPositionTop(e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bottom</Label>
                  <Input
                    type="number"
                    value={logoPositionBottom ?? ''}
                    onChange={(e) => setLogoPositionBottom(e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Left</Label>
                  <Input
                    type="number"
                    value={logoPositionLeft ?? ''}
                    onChange={(e) => setLogoPositionLeft(e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Right</Label>
                  <Input
                    type="number"
                    value={logoPositionRight ?? ''}
                    onChange={(e) => setLogoPositionRight(e.target.value ? Number(e.target.value) : null)}
                    placeholder="auto"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Header Background Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">Header Background</Label>
              {headerBgPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gold/30">
                  <img src={headerBgPreview} alt="Header BG" className="w-full h-full object-cover" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeaderBgPreview(null)}
                    className="absolute top-2 right-2 bg-background/80 text-foreground"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                  <ImagePlus className="w-8 h-8 text-gold/50 mb-1" />
                  <span className="text-muted-foreground text-sm">Upload header background</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setHeaderBgPreview)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Footer Text */}
            <div className="space-y-2">
              <Label className="text-foreground">Footer Text</Label>
              <Textarea
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Footer copyright text"
                className="bg-input border-gold/30 text-foreground resize-none"
                rows={2}
              />
            </div>

            {/* Footer Background Color */}
            <div className="space-y-2">
              <Label className="text-foreground">Footer Background Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={footerBgColor}
                  onChange={(e) => setFooterBgColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                />
                <Input
                  value={footerBgColor}
                  onChange={(e) => setFooterBgColor(e.target.value)}
                  placeholder="#1a1a2e"
                  className="bg-input border-gold/30 text-foreground flex-1"
                />
              </div>
            </div>

            {/* Footer Text Color */}
            <div className="space-y-2">
              <Label className="text-foreground">Footer Text Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={footerTextColor}
                  onChange={(e) => setFooterTextColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                />
                <Input
                  value={footerTextColor}
                  onChange={(e) => setFooterTextColor(e.target.value)}
                  placeholder="#d4af37"
                  className="bg-input border-gold/30 text-foreground flex-1"
                />
              </div>
            </div>

            {/* Category Styling Section */}
            <div className="border-t border-gold/20 pt-4 mt-4">
              <h3 className="text-foreground font-medium mb-4">Category Button Styling</h3>
              
              {/* Category Text Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Category Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={categoryTextColor}
                    onChange={(e) => setCategoryTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={categoryTextColor}
                    onChange={(e) => setCategoryTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Category Font */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Category Font</Label>
                <select
                  value={categoryFont}
                  onChange={(e) => setCategoryFont(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gold/30 bg-input text-foreground"
                  style={{ fontFamily: categoryFont }}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Category Button Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={categoryBgColor}
                    onChange={(e) => setCategoryBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={categoryBgColor}
                    onChange={(e) => setCategoryBgColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Category Active Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Active Category Button Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={categoryActiveBgColor}
                    onChange={(e) => setCategoryActiveBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={categoryActiveBgColor}
                    onChange={(e) => setCategoryActiveBgColor(e.target.value)}
                    placeholder="#16a34a"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex gap-2 flex-wrap">
                <span 
                  className="px-4 py-2 rounded-full text-sm"
                  style={{ 
                    backgroundColor: categoryActiveBgColor, 
                    color: categoryTextColor,
                    fontFamily: categoryFont 
                  }}
                >
                  All
                </span>
                <span 
                  className="px-4 py-2 rounded-full text-sm border"
                  style={{ 
                    backgroundColor: categoryBgColor, 
                    color: categoryTextColor,
                    fontFamily: categoryFont 
                  }}
                >
                  Sample
                </span>
              </div>
            </div>

            {/* Products Section Title Color */}
            <div className="border-t border-gold/20 pt-4 mt-4">
              <h3 className="text-foreground font-medium mb-4">Products Section Title</h3>
              <div className="space-y-2">
                <Label className="text-foreground">Title Color ("Our Products")</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productsTitleColor}
                    onChange={(e) => setProductsTitleColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productsTitleColor}
                    onChange={(e) => setProductsTitleColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
                <div 
                  className="p-3 rounded mt-2 text-center"
                  style={{ backgroundColor: bodyBgColor }}
                >
                  <span style={{ color: productsTitleColor }} className="text-lg font-medium">
                    ផលិតផលរបស់យើង / Our Products
                  </span>
                </div>
              </div>
            </div>

            {/* Product Card Theme Section */}
            <div className="border-t border-gold/20 pt-4 mt-4">
              <h3 className="text-foreground font-medium mb-4">Product Card Theme</h3>
              
              {/* Product Card Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Card Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productCardBgColor}
                    onChange={(e) => setProductCardBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productCardBgColor}
                    onChange={(e) => setProductCardBgColor(e.target.value)}
                    placeholder="#1a1a2e"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used when no background image is set</p>
              </div>

              {/* Product Card Background Image */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Card Background Image (Optional)</Label>
                {productCardBgImagePreview ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={productCardBgImagePreview} alt="Card BG" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProductCardBgImagePreview(null)}
                      className="absolute top-2 right-2 bg-background/80 text-foreground"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-6 h-6 text-gold/50 mb-1" />
                    <span className="text-muted-foreground text-xs">Upload card background</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setProductCardBgImagePreview)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Leave empty to use background color only</p>
              </div>

              {/* Product Card Border Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Card Border Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productCardBorderColor}
                    onChange={(e) => setProductCardBorderColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productCardBorderColor}
                    onChange={(e) => setProductCardBorderColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Product Card Shine/Shadow Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Card Shine/Shadow Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productCardShineColor}
                    onChange={(e) => setProductCardShineColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productCardShineColor}
                    onChange={(e) => setProductCardShineColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
                <div 
                  className="p-3 rounded mt-2 text-center text-sm"
                  style={{ 
                    boxShadow: `0 0 20px ${productCardShineColor}80`,
                    backgroundColor: productCardBgColor,
                    border: `1px solid ${productCardBorderColor}`,
                  }}
                >
                  <span style={{ color: productNameColor }}>Shine Preview</span>
                </div>
              </div>

              {/* Shine Animation Speed */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Shine Animation Speed</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={productCardShineSpeed}
                    onChange={(e) => setProductCardShineSpeed(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-input rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-foreground w-16 text-center">{productCardShineSpeed}s</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {productCardShineSpeed <= 1 ? "Fast pulse" : productCardShineSpeed >= 4 ? "Slow pulse" : "Medium pulse"} 
                  {" "}(lower = faster)
                </p>
              </div>

              {/* Product Name Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Product Name Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productNameColor}
                    onChange={(e) => setProductNameColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productNameColor}
                    onChange={(e) => setProductNameColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Product Price Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Price Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productPriceColor}
                    onChange={(e) => setProductPriceColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productPriceColor}
                    onChange={(e) => setProductPriceColor(e.target.value)}
                    placeholder="#d4af37"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Product Description Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Description Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productDescriptionColor}
                    onChange={(e) => setProductDescriptionColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productDescriptionColor}
                    onChange={(e) => setProductDescriptionColor(e.target.value)}
                    placeholder="#9ca3af"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Order Button Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Order Button Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productButtonBgColor}
                    onChange={(e) => setProductButtonBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productButtonBgColor}
                    onChange={(e) => setProductButtonBgColor(e.target.value)}
                    placeholder="#d4a574"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Order Button Text Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Order Button Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={productButtonTextColor}
                    onChange={(e) => setProductButtonTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gold/30 cursor-pointer"
                  />
                  <Input
                    value={productButtonTextColor}
                    onChange={(e) => setProductButtonTextColor(e.target.value)}
                    placeholder="#1a1a2e"
                    className="bg-input border-gold/30 text-foreground flex-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div 
                className="p-4 rounded-lg border-2"
                style={{ 
                  backgroundColor: productCardBgColor,
                  borderColor: productCardBorderColor
                }}
              >
                <p className="text-sm font-semibold" style={{ color: productNameColor }}>Sample Product</p>
                <p className="text-lg font-bold" style={{ color: productPriceColor }}>$9.99</p>
                <p className="text-xs" style={{ color: productDescriptionColor }}>Description text</p>
                <button 
                  className="mt-2 px-4 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: productButtonBgColor,
                    color: productButtonTextColor
                  }}
                >
                  Order Now
                </button>
              </div>
            </div>

            {/* Product Detail Dialog Theme Section */}
            <div className="border-t border-gold/20 pt-4 mt-4">
              <h3 className="text-foreground font-medium mb-4">Product Detail Popup Theme</h3>
              
              {/* Dialog Background Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Popup Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={dialogBgColor} onChange={(e) => setDialogBgColor(e.target.value)} className="w-12 h-10 rounded border border-gold/30 cursor-pointer" />
                  <Input value={dialogBgColor} onChange={(e) => setDialogBgColor(e.target.value)} className="bg-input border-gold/30 text-foreground flex-1" />
                </div>
              </div>

              {/* Dialog Background Image */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Popup Background Image</Label>
                {dialogBgImagePreview ? (
                  <div className="relative w-full h-20 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={dialogBgImagePreview} alt="Dialog BG" className="w-full h-full object-cover" />
                    <Button variant="ghost" size="sm" onClick={() => setDialogBgImagePreview(null)} className="absolute top-1 right-1 bg-background/80 text-foreground h-6 text-xs px-2">×</Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-5 h-5 text-gold/50" />
                    <span className="text-xs text-muted-foreground mt-1">Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setDialogBgImagePreview)} />
                  </label>
                )}
              </div>

              {/* Dialog Border Color */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Popup Border Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={dialogBorderColor} onChange={(e) => setDialogBorderColor(e.target.value)} className="w-12 h-10 rounded border border-gold/30 cursor-pointer" />
                  <Input value={dialogBorderColor} onChange={(e) => setDialogBorderColor(e.target.value)} className="bg-input border-gold/30 text-foreground flex-1" />
                </div>
              </div>

              {/* Dialog Title/Price/Description Colors */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Title Color</Label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={dialogTitleColor} onChange={(e) => setDialogTitleColor(e.target.value)} className="w-8 h-8 rounded border border-gold/30 cursor-pointer" />
                    <Input value={dialogTitleColor} onChange={(e) => setDialogTitleColor(e.target.value)} className="bg-input border-gold/30 text-foreground text-xs h-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Price Color</Label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={dialogPriceColor} onChange={(e) => setDialogPriceColor(e.target.value)} className="w-8 h-8 rounded border border-gold/30 cursor-pointer" />
                    <Input value={dialogPriceColor} onChange={(e) => setDialogPriceColor(e.target.value)} className="bg-input border-gold/30 text-foreground text-xs h-8" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label className="text-foreground text-xs">Description Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={dialogDescriptionColor} onChange={(e) => setDialogDescriptionColor(e.target.value)} className="w-12 h-10 rounded border border-gold/30 cursor-pointer" />
                  <Input value={dialogDescriptionColor} onChange={(e) => setDialogDescriptionColor(e.target.value)} className="bg-input border-gold/30 text-foreground flex-1" />
                </div>
              </div>

              {/* Social Icon Upload + Colors */}
              <div className="space-y-3 mb-4">
                <Label className="text-foreground text-sm font-medium">Social Icons</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Facebook */}
                  <div className="space-y-1">
                    <Label className="text-foreground text-xs">Facebook</Label>
                    {dialogFacebookIconPreview ? (
                      <div className="relative w-full h-12 rounded overflow-hidden border border-gold/30">
                        <img src={dialogFacebookIconPreview} alt="FB" className="w-full h-full object-contain" />
                        <button onClick={() => setDialogFacebookIconPreview(null)} className="absolute top-0 right-0 bg-background/80 text-foreground h-4 w-4 text-xs">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-12 border border-dashed border-gold/30 rounded cursor-pointer hover:border-gold/60 bg-input/50">
                        <ImagePlus className="w-4 h-4 text-gold/50" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setDialogFacebookIconPreview)} />
                      </label>
                    )}
                    <input type="color" value={dialogFacebookIconColor} onChange={(e) => setDialogFacebookIconColor(e.target.value)} className="w-full h-6 rounded border border-gold/30 cursor-pointer" title="Background color (if no image)" />
                  </div>
                  {/* TikTok */}
                  <div className="space-y-1">
                    <Label className="text-foreground text-xs">TikTok</Label>
                    {dialogTiktokIconPreview ? (
                      <div className="relative w-full h-12 rounded overflow-hidden border border-gold/30">
                        <img src={dialogTiktokIconPreview} alt="TikTok" className="w-full h-full object-contain" />
                        <button onClick={() => setDialogTiktokIconPreview(null)} className="absolute top-0 right-0 bg-background/80 text-foreground h-4 w-4 text-xs">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-12 border border-dashed border-gold/30 rounded cursor-pointer hover:border-gold/60 bg-input/50">
                        <ImagePlus className="w-4 h-4 text-gold/50" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setDialogTiktokIconPreview)} />
                      </label>
                    )}
                    <input type="color" value={dialogTiktokIconColor} onChange={(e) => setDialogTiktokIconColor(e.target.value)} className="w-full h-6 rounded border border-gold/30 cursor-pointer" title="Background color (if no image)" />
                  </div>
                  {/* Telegram */}
                  <div className="space-y-1">
                    <Label className="text-foreground text-xs">Telegram</Label>
                    {dialogTelegramIconPreview ? (
                      <div className="relative w-full h-12 rounded overflow-hidden border border-gold/30">
                        <img src={dialogTelegramIconPreview} alt="Telegram" className="w-full h-full object-contain" />
                        <button onClick={() => setDialogTelegramIconPreview(null)} className="absolute top-0 right-0 bg-background/80 text-foreground h-4 w-4 text-xs">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-12 border border-dashed border-gold/30 rounded cursor-pointer hover:border-gold/60 bg-input/50">
                        <ImagePlus className="w-4 h-4 text-gold/50" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setDialogTelegramIconPreview)} />
                      </label>
                    )}
                    <input type="color" value={dialogTelegramIconColor} onChange={(e) => setDialogTelegramIconColor(e.target.value)} className="w-full h-6 rounded border border-gold/30 cursor-pointer" title="Background color (if no image)" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Upload custom icons or use color for default icons</p>
              </div>

              {/* Button and Close Icon Colors */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="space-y-1">
                  <Label className="text-foreground text-xs">Button BG</Label>
                  <input type="color" value={dialogButtonBgColor} onChange={(e) => setDialogButtonBgColor(e.target.value)} className="w-full h-8 rounded border border-gold/30 cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-xs">Button Text</Label>
                  <input type="color" value={dialogButtonTextColor} onChange={(e) => setDialogButtonTextColor(e.target.value)} className="w-full h-8 rounded border border-gold/30 cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-xs">Close Icon</Label>
                  <input type="color" value={dialogCloseIconColor} onChange={(e) => setDialogCloseIconColor(e.target.value)} className="w-full h-8 rounded border border-gold/30 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Footer Content Section */}
            <div className="border-t border-gold/20 pt-4 mt-4">
              <h3 className="text-foreground font-medium mb-4">Footer Content</h3>
              
              {/* Footer Description */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Site Description</Label>
                <Textarea
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Short description for footer"
                  className="bg-input border-gold/30 text-foreground resize-none"
                  rows={2}
                />
              </div>

              {/* Footer Social Links */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Facebook</Label>
                <div className="flex gap-2 items-start">
                  {footerFacebookIconPreview ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 flex-shrink-0">
                      <img src={footerFacebookIconPreview} alt="FB Icon" className="w-full h-full object-cover" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFooterFacebookIconPreview(null)}
                        className="absolute -top-1 -right-1 bg-background/80 text-foreground h-4 w-4 text-xs p-0 rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-10 h-10 border-2 border-dashed border-gold/30 rounded-full cursor-pointer hover:border-gold/60 transition-colors bg-input/50 flex-shrink-0">
                      <ImagePlus className="w-4 h-4 text-gold/50" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setFooterFacebookIconPreview)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <Input
                    value={footerFacebookUrl}
                    onChange={(e) => setFooterFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label className="text-foreground">TikTok</Label>
                <div className="flex gap-2 items-start">
                  {footerTiktokIconPreview ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 flex-shrink-0">
                      <img src={footerTiktokIconPreview} alt="TikTok Icon" className="w-full h-full object-cover" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFooterTiktokIconPreview(null)}
                        className="absolute -top-1 -right-1 bg-background/80 text-foreground h-4 w-4 text-xs p-0 rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-10 h-10 border-2 border-dashed border-gold/30 rounded-full cursor-pointer hover:border-gold/60 transition-colors bg-input/50 flex-shrink-0">
                      <ImagePlus className="w-4 h-4 text-gold/50" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setFooterTiktokIconPreview)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <Input
                    value={footerTiktokUrl}
                    onChange={(e) => setFooterTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@yourprofile"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Telegram</Label>
                <div className="flex gap-2 items-start">
                  {footerTelegramIconPreview ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 flex-shrink-0">
                      <img src={footerTelegramIconPreview} alt="Telegram Icon" className="w-full h-full object-cover" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFooterTelegramIconPreview(null)}
                        className="absolute -top-1 -right-1 bg-background/80 text-foreground h-4 w-4 text-xs p-0 rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-10 h-10 border-2 border-dashed border-gold/30 rounded-full cursor-pointer hover:border-gold/60 transition-colors bg-input/50 flex-shrink-0">
                      <ImagePlus className="w-4 h-4 text-gold/50" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setFooterTelegramIconPreview)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <Input
                    value={footerTelegramUrl}
                    onChange={(e) => setFooterTelegramUrl(e.target.value)}
                    placeholder="https://t.me/yourchannel"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Payment Text</Label>
                <Input
                  value={footerPaymentText}
                  onChange={(e) => setFooterPaymentText(e.target.value)}
                  placeholder="Accept Payment"
                  className="bg-input border-gold/30 text-foreground"
                />
              </div>

              <div className="space-y-2 mb-4">
                <Label className="text-foreground">Payment Icon</Label>
                {footerPaymentIconPreview ? (
                  <div className="relative w-24 h-12 rounded-lg overflow-hidden border-2 border-gold/30">
                    <img src={footerPaymentIconPreview} alt="Payment Icon" className="w-full h-full object-contain bg-background" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFooterPaymentIconPreview(null)}
                      className="absolute top-0 right-0 bg-background/80 text-foreground h-6 text-xs"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-12 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                    <ImagePlus className="w-4 h-4 text-gold/50" />
                    <span className="text-muted-foreground text-xs">Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setFooterPaymentIconPreview)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark font-display gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
