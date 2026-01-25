-- Add footer text color column
ALTER TABLE public.site_settings 
ADD COLUMN footer_text_color text DEFAULT '#d4af37';