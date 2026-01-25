-- Add product card shine/shadow color customization
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS product_card_shine_color text DEFAULT '#d4af37';