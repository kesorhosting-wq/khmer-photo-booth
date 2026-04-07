import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadImageToStorage } from "@/lib/uploadImage";
import { RefreshCw, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

export const ReloadEditDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loadingImagePreview, setLoadingImagePreview] = useState<string | null>(null);
  
  // Page title and favicon
  const [pageTitle, setPageTitle] = useState("");
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  // Dialog popup icon uploads
  const [dialogFacebookIconPreview, setDialogFacebookIconPreview] = useState<string | null>(null);
  const [dialogTiktokIconPreview, setDialogTiktokIconPreview] = useState<string | null>(null);
  const [dialogTelegramIconPreview, setDialogTelegramIconPreview] = useState<string | null>(null);
  
  // Footer icon uploads
  const [footerFacebookIconPreview, setFooterFacebookIconPreview] = useState<string | null>(null);
  const [footerTiktokIconPreview, setFooterTiktokIconPreview] = useState<string | null>(null);
  const [footerTelegramIconPreview, setFooterTelegramIconPreview] = useState<string | null>(null);
  const [footerPaymentIconPreview, setFooterPaymentIconPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("id, loading_image_url, page_title, favicon_url, dialog_facebook_icon_url, dialog_tiktok_icon_url, dialog_telegram_icon_url, footer_facebook_icon_url, footer_tiktok_icon_url, footer_telegram_icon_url, footer_payment_icon_url")
      .maybeSingle();

    if (data) {
      setSettingsId(data.id);
      setLoadingImagePreview(data.loading_image_url);
      setPageTitle(data.page_title || "");
      setFaviconPreview(data.favicon_url);
      setDialogFacebookIconPreview((data as any).dialog_facebook_icon_url);
      setDialogTiktokIconPreview((data as any).dialog_tiktok_icon_url);
      setDialogTelegramIconPreview((data as any).dialog_telegram_icon_url);
      setFooterFacebookIconPreview(data.footer_facebook_icon_url);
      setFooterTiktokIconPreview(data.footer_tiktok_icon_url);
      setFooterTelegramIconPreview(data.footer_telegram_icon_url);
      setFooterPaymentIconPreview(data.footer_payment_icon_url);
    }
    setLoading(false);
  };

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
      if (settingsId) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            loading_image_url: loadingImagePreview,
            page_title: pageTitle || null,
            favicon_url: faviconPreview,
            dialog_facebook_icon_url: dialogFacebookIconPreview,
            dialog_tiktok_icon_url: dialogTiktokIconPreview,
            dialog_telegram_icon_url: dialogTelegramIconPreview,
            footer_facebook_icon_url: footerFacebookIconPreview,
            footer_tiktok_icon_url: footerTiktokIconPreview,
            footer_telegram_icon_url: footerTelegramIconPreview,
            footer_payment_icon_url: footerPaymentIconPreview,
          })
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({
            loading_image_url: loadingImagePreview,
            page_title: pageTitle || null,
            favicon_url: faviconPreview,
            dialog_facebook_icon_url: dialogFacebookIconPreview,
            dialog_tiktok_icon_url: dialogTiktokIconPreview,
            dialog_telegram_icon_url: dialogTelegramIconPreview,
            footer_facebook_icon_url: footerFacebookIconPreview,
            footer_tiktok_icon_url: footerTiktokIconPreview,
            footer_telegram_icon_url: footerTelegramIconPreview,
            footer_payment_icon_url: footerPaymentIconPreview,
          });

        if (error) throw error;
      }

      toast.success("Settings saved!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadBox = ({ 
    label, 
    preview, 
    setPreview 
  }: { 
    label: string; 
    preview: string | null; 
    setPreview: (value: string | null) => void 
  }) => (
    <div className="space-y-1">
      <Label className="text-foreground text-xs">{label}</Label>
      {preview ? (
        <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden border-2 border-gold/30">
          <img 
            src={preview} 
            alt={label} 
            className="w-full h-full object-contain bg-background" 
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreview(null)}
            className="absolute top-0 right-0 bg-background/80 text-foreground h-5 w-5 p-0 rounded-full text-xs"
          >
            ×
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-16 h-16 mx-auto border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
          <ImagePlus className="w-5 h-5 text-gold/50" />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setPreview)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 text-white hover:bg-purple-700 font-display gap-2">
          <RefreshCw className="w-4 h-4" />
          Reload Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display">
            Icon & Image Manager
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Browser Tab Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gold border-b border-gold/30 pb-1">Browser Tab</h3>
                <p className="text-xs text-muted-foreground">
                  Page title and favicon shown in browser tab
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-foreground text-xs">Page Title</Label>
                    <Input
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="Enter page title..."
                      className="bg-input border-gold/30 text-foreground"
                    />
                  </div>
                  <ImageUploadBox 
                    label="Favicon (Tab Icon)" 
                    preview={faviconPreview} 
                    setPreview={setFaviconPreview} 
                  />
                </div>
              </div>

              {/* Loading Image Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gold border-b border-gold/30 pb-1">Loading Screen</h3>
                <p className="text-xs text-muted-foreground">
                  Image/GIF displayed when page is loading
                </p>
                <ImageUploadBox 
                  label="Loading Image" 
                  preview={loadingImagePreview} 
                  setPreview={setLoadingImagePreview} 
                />
              </div>

              {/* Product Popup Icons Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gold border-b border-gold/30 pb-1">Product Popup Icons</h3>
                <p className="text-xs text-muted-foreground">
                  Custom icons for social media buttons in product detail popup
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <ImageUploadBox 
                    label="Facebook" 
                    preview={dialogFacebookIconPreview} 
                    setPreview={setDialogFacebookIconPreview} 
                  />
                  <ImageUploadBox 
                    label="TikTok" 
                    preview={dialogTiktokIconPreview} 
                    setPreview={setDialogTiktokIconPreview} 
                  />
                  <ImageUploadBox 
                    label="Telegram" 
                    preview={dialogTelegramIconPreview} 
                    setPreview={setDialogTelegramIconPreview} 
                  />
                </div>
              </div>

              {/* Footer Icons Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gold border-b border-gold/30 pb-1">Footer Icons</h3>
                <p className="text-xs text-muted-foreground">
                  Custom icons for social media and payment in footer
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <ImageUploadBox 
                    label="Facebook" 
                    preview={footerFacebookIconPreview} 
                    setPreview={setFooterFacebookIconPreview} 
                  />
                  <ImageUploadBox 
                    label="TikTok" 
                    preview={footerTiktokIconPreview} 
                    setPreview={setFooterTiktokIconPreview} 
                  />
                  <ImageUploadBox 
                    label="Telegram" 
                    preview={footerTelegramIconPreview} 
                    setPreview={setFooterTelegramIconPreview} 
                  />
                  <ImageUploadBox 
                    label="Payment" 
                    preview={footerPaymentIconPreview} 
                    setPreview={setFooterPaymentIconPreview} 
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                Save All
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
