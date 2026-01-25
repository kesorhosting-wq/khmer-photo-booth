-- Add custom icon URLs for dialog social media buttons
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS dialog_facebook_icon_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dialog_tiktok_icon_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dialog_telegram_icon_url text DEFAULT NULL;