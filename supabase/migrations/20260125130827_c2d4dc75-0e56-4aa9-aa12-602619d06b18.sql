-- Create enum for category function types
CREATE TYPE public.category_function AS ENUM ('link', 'account', 'upload');

-- Add function_type to categories
ALTER TABLE public.categories 
ADD COLUMN function_type public.category_function NOT NULL DEFAULT 'link';

-- Create product_accounts table for storing account details
CREATE TABLE public.product_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  account_details TEXT[] NOT NULL DEFAULT '{}', -- Array of 5-10 detail lines
  is_sold BOOLEAN NOT NULL DEFAULT false,
  sold_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_files table for upload products
CREATE TABLE public.product_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_account_id UUID REFERENCES public.product_accounts(id) ON DELETE SET NULL,
  product_file_id UUID REFERENCES public.product_files(id) ON DELETE SET NULL,
  transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_gateways table for KHQR config
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.product_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- RLS for product_accounts
CREATE POLICY "Anyone can view unsold account count" ON public.product_accounts
FOR SELECT USING (true);

CREATE POLICY "Admins can manage product accounts" ON public.product_accounts
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their purchased accounts" ON public.product_accounts
FOR SELECT USING (auth.uid() = sold_to_user_id);

-- RLS for product_files
CREATE POLICY "Anyone can view product files metadata" ON public.product_files
FOR SELECT USING (true);

CREATE POLICY "Admins can manage product files" ON public.product_files
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for cart_items
CREATE POLICY "Users can view own cart" ON public.cart_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart" ON public.cart_items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.cart_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from cart" ON public.cart_items
FOR DELETE USING (auth.uid() = user_id);

-- RLS for orders
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS for payment_gateways
CREATE POLICY "Anyone can view active gateways" ON public.payment_gateways
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage gateways" ON public.payment_gateways
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_product_accounts_updated_at
BEFORE UPDATE ON public.product_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default KHQR payment gateway config
INSERT INTO public.payment_gateways (slug, name, config) VALUES (
  'ikhode-bakong',
  'Bakong KHQR',
  '{"node_api_url": "", "websocket_url": "", "webhook_secret": "", "bakong_account": ""}'
);

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false);

-- Storage policies for product files
CREATE POLICY "Admins can upload product files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product files" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product files" ON storage.objects
FOR DELETE USING (bucket_id = 'product-files' AND has_role(auth.uid(), 'admin'));

-- Users who purchased can download (checked via edge function with signed URLs)
CREATE POLICY "Authenticated users can view product files" ON storage.objects
FOR SELECT USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');