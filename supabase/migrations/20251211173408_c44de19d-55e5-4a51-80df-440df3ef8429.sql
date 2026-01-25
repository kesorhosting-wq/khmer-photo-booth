-- Add custom social icon URL columns to site_settings
ALTER TABLE public.site_settings
ADD COLUMN footer_telegram_icon_url TEXT DEFAULT NULL,
ADD COLUMN footer_tiktok_icon_url TEXT DEFAULT NULL,
ADD COLUMN footer_facebook_icon_url TEXT DEFAULT NULL;