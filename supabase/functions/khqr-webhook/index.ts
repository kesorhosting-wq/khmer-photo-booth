import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract order ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook secret (if configured)
    const { data: gateway } = await supabase
      .from('payment_gateways')
      .select('config')
      .eq('slug', 'ikhode-bakong')
      .single();

    const webhookSecret = gateway?.config?.webhook_secret;
    if (webhookSecret) {
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (token !== webhookSecret) {
        console.error('Invalid webhook secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    console.log('Webhook received for order:', orderId, body);

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product_account_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status === 'paid') {
      // Already processed
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status to paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    // Also update any related orders with the same transaction_id
    if (order.transaction_id) {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('transaction_id', order.transaction_id)
        .eq('status', 'pending');
    }

    // If this is an account product, mark the account as sold
    if (order.product_account_id) {
      await supabase
        .from('product_accounts')
        .update({
          is_sold: true,
          sold_to_user_id: order.user_id,
          sold_at: new Date().toISOString(),
        })
        .eq('id', order.product_account_id);
    }

    console.log('Order fulfilled:', orderId);

    return new Response(
      JSON.stringify({ success: true, orderId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
