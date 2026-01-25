import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  action: 'generate-khqr' | 'check-status';
  amount?: number;
  currency?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  orderId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentRequest = await req.json();
    console.log('Payment request:', body);

    if (body.action === 'check-status') {
      // Check order status
      const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', body.orderId)
        .eq('user_id', user.id)
        .single();

      return new Response(
        JSON.stringify({ status: order?.status || 'unknown' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'generate-khqr') {
      const { amount, currency, items } = body;

      if (!amount || !items || items.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Amount and items are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get payment gateway config
      const { data: gateway } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('slug', 'ikhode-bakong')
        .eq('is_active', true)
        .single();

      // Generate transaction ID (max 25 chars for Bakong compatibility)
      const timestamp = Date.now().toString(36).toUpperCase().slice(-8);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const transactionId = `ORD-${timestamp}-${random}`.slice(0, 25);

      // Create orders for each item
      const orderPromises = items.map(async (item) => {
        // Get category function type
        const { data: product } = await supabase
          .from('products')
          .select('category_id')
          .eq('id', item.productId)
          .single();

        let categoryFunction = 'link';
        if (product?.category_id) {
          const { data: category } = await supabase
            .from('categories')
            .select('function_type')
            .eq('id', product.category_id)
            .single();
          categoryFunction = category?.function_type || 'link';
        }

        // For account products, reserve an available account
        let productAccountId = null;
        if (categoryFunction === 'account') {
          const { data: account, error: accountError } = await supabase
            .from('product_accounts')
            .select('id')
            .eq('product_id', item.productId)
            .eq('is_sold', false)
            .limit(1)
            .single();

          if (accountError || !account) {
            throw new Error(`Product ${item.productId} is out of stock`);
          }
          productAccountId = account.id;
        }

        // For upload products, get the file
        let productFileId = null;
        if (categoryFunction === 'upload') {
          const { data: file } = await supabase
            .from('product_files')
            .select('id')
            .eq('product_id', item.productId)
            .single();
          
          productFileId = file?.id || null;
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            product_id: item.productId,
            product_account_id: productAccountId,
            product_file_id: productFileId,
            transaction_id: transactionId,
            amount: item.price * item.quantity,
            currency: currency || 'USD',
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;
        return order;
      });

      const orders = await Promise.all(orderPromises);
      const primaryOrderId = orders[0]?.id;

      // Generate QR code
      // If gateway is configured, use external API
      let qrCodeData = '';
      let wsUrl = '';

      if (gateway?.config?.node_api_url) {
        // Call external KHQR API
        const apiUrl = gateway.config.node_api_url;
        const callbackUrl = `${supabaseUrl}/functions/v1/khqr-webhook/${primaryOrderId}`;
        
        try {
          // Build request payload matching iKhode API format
          const requestPayload: Record<string, unknown> = {
            amount,
            currency: currency || 'USD',
            transactionId,
            billNumber: transactionId,
            callbackUrl,
            storeLabel: gateway.config.store_label || 'Store',
            terminalLabel: gateway.config.terminal_label || 'POS',
          };

          // Add bakong account if configured
          if (gateway.config.bakong_account) {
            requestPayload.username = gateway.config.bakong_account;
            requestPayload.accountId = gateway.config.bakong_account;
          }

          // Add secret for webhook verification if configured
          if (gateway.config.webhook_secret) {
            requestPayload.secret = gateway.config.webhook_secret;
          }

          console.log('Calling KHQR API:', apiUrl, { ...requestPayload, secret: '[REDACTED]' });

          const response = await fetch(`${apiUrl}/generate-khqr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('KHQR API error response:', response.status, errorText);
            throw new Error(`KHQR API returned ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          console.log('KHQR API response:', { success: !!result.qrCodeData || !!result.qrCode });
          
          qrCodeData = result.qrCodeData || result.qrCode || result.data?.qrCode;
          wsUrl = gateway.config.websocket_url || '';

          if (!qrCodeData) {
            console.error('No QR code in response:', result);
            throw new Error('No QR code returned from API');
          }
        } catch (error) {
          console.error('External API error:', error);
          // Fall back to placeholder QR
          qrCodeData = generatePlaceholderQR(amount, transactionId);
        }
      } else {
        // Generate placeholder QR for demo purposes
        qrCodeData = generatePlaceholderQR(amount, transactionId);
      }

      // Remove items from cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .in('product_id', items.map(i => i.productId));

      console.log('Payment generated:', { transactionId, orderId: primaryOrderId });

      return new Response(
        JSON.stringify({
          success: true,
          qrCodeData,
          transactionId,
          orderId: primaryOrderId,
          wsUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePlaceholderQR(amount: number, transactionId: string): string {
  // Generate a simple placeholder QR code SVG as data URL
  // In production, this would be replaced by actual KHQR generation
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="160" height="160" fill="none" stroke="#d4af37" stroke-width="4"/>
      <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">KHQR Payment</text>
      <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#d4af37">${amount} USD</text>
      <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">${transactionId}</text>
      <text x="100" y="170" text-anchor="middle" font-family="Arial" font-size="9" fill="#999">Configure payment gateway in admin</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
