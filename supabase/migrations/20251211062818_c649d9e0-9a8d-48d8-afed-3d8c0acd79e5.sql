-- Add social media and order link columns to products table
ALTER TABLE public.products 
ADD COLUMN facebook_url text,
ADD COLUMN tiktok_url text,
ADD COLUMN telegram_url text,
ADD COLUMN order_url text;