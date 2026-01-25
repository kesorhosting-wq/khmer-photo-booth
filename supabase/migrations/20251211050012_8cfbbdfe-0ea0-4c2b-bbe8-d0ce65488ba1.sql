-- Add site name color and font columns
ALTER TABLE public.site_settings
ADD COLUMN site_name_color text DEFAULT '#d4af37',
ADD COLUMN site_name_font text DEFAULT 'Cinzel';
