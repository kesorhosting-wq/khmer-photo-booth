-- Add page_title and favicon_url columns to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS page_title TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT;