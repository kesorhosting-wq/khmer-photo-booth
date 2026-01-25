-- Add logo size columns to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN logo_width integer DEFAULT 80,
ADD COLUMN logo_height integer DEFAULT 80;