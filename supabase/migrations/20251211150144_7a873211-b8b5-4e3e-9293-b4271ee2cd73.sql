-- Add product card shine animation speed customization
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS product_card_shine_speed numeric DEFAULT 2;