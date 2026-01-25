-- Add products section title color customization
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS products_title_color text DEFAULT '#d4af37';