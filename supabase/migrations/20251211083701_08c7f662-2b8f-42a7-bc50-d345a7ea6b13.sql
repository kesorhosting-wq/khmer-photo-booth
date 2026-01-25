-- Add image_fit column to products table for controlling image display
ALTER TABLE public.products 
ADD COLUMN image_fit text DEFAULT 'cover';

-- Add image_custom_width and image_custom_height for custom sizing
ALTER TABLE public.products 
ADD COLUMN image_custom_width integer DEFAULT NULL;

ALTER TABLE public.products 
ADD COLUMN image_custom_height integer DEFAULT NULL;