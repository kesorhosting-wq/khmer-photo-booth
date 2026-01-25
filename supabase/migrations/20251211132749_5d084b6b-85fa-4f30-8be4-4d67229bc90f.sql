-- Add body background and text color settings
ALTER TABLE public.site_settings 
ADD COLUMN body_bg_color TEXT DEFAULT '#0d0d0d',
ADD COLUMN body_bg_image_url TEXT,
ADD COLUMN body_text_color TEXT DEFAULT '#ffffff';