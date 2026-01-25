-- Add product card background image column to site_settings
ALTER TABLE public.site_settings
ADD COLUMN product_card_bg_image_url TEXT DEFAULT NULL;