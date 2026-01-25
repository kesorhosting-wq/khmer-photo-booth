-- Add product detail dialog customization columns to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS dialog_bg_color text DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS dialog_bg_image_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dialog_border_color text DEFAULT '#d4af37',
ADD COLUMN IF NOT EXISTS dialog_title_color text DEFAULT '#d4af37',
ADD COLUMN IF NOT EXISTS dialog_price_color text DEFAULT '#d4af37',
ADD COLUMN IF NOT EXISTS dialog_description_color text DEFAULT '#9ca3af',
ADD COLUMN IF NOT EXISTS dialog_button_bg_color text DEFAULT '#d4a574',
ADD COLUMN IF NOT EXISTS dialog_button_text_color text DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS dialog_facebook_icon_color text DEFAULT '#1877F2',
ADD COLUMN IF NOT EXISTS dialog_tiktok_icon_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS dialog_telegram_icon_color text DEFAULT '#0088CC',
ADD COLUMN IF NOT EXISTS dialog_close_icon_color text DEFAULT '#ffffff';