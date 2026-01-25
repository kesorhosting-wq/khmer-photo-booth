-- Add logo position columns to site_settings
ALTER TABLE public.site_settings
ADD COLUMN logo_position_top INTEGER DEFAULT 0,
ADD COLUMN logo_position_bottom INTEGER DEFAULT NULL,
ADD COLUMN logo_position_left INTEGER DEFAULT NULL,
ADD COLUMN logo_position_right INTEGER DEFAULT NULL;