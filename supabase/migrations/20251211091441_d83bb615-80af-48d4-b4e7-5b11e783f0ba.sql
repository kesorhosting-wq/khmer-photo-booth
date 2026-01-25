-- Add product card theme customization columns
ALTER TABLE public.site_settings
ADD COLUMN product_card_bg_color TEXT DEFAULT '#1a1a2e',
ADD COLUMN product_name_color TEXT DEFAULT '#d4af37',
ADD COLUMN product_price_color TEXT DEFAULT '#d4af37',
ADD COLUMN product_description_color TEXT DEFAULT '#9ca3af',
ADD COLUMN product_button_bg_color TEXT DEFAULT '#d4a574',
ADD COLUMN product_button_text_color TEXT DEFAULT '#1a1a2e',
ADD COLUMN product_card_border_color TEXT DEFAULT '#d4af37';