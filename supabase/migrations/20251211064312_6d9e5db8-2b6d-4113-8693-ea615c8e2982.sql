-- Add footer customization columns
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS footer_description text DEFAULT 'High-quality products with unique designs.',
ADD COLUMN IF NOT EXISTS footer_facebook_url text,
ADD COLUMN IF NOT EXISTS footer_tiktok_url text,
ADD COLUMN IF NOT EXISTS footer_telegram_url text,
ADD COLUMN IF NOT EXISTS footer_payment_text text DEFAULT 'Accept Payment',
ADD COLUMN IF NOT EXISTS footer_payment_icon_url text;