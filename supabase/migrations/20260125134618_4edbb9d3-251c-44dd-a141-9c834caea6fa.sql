-- Drop the overly permissive policy that exposes account details
DROP POLICY IF EXISTS "Anyone can view unsold account count" ON public.product_accounts;

-- Create a secure function to count available accounts (doesn't expose details)
CREATE OR REPLACE FUNCTION public.get_available_account_count(p_product_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.product_accounts
  WHERE product_id = p_product_id
    AND is_sold = false;
$$;

-- Grant execute to all users
GRANT EXECUTE ON FUNCTION public.get_available_account_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_account_count(UUID) TO anon;