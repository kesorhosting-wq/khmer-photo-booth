-- Add loading/reload image URL column to site_settings
ALTER TABLE public.site_settings
ADD COLUMN loading_image_url TEXT DEFAULT NULL;