import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, QrCode, CheckCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PaymentState {
  status: 'idle' | 'generating' | 'pending' | 'checking' | 'success' | 'error';
  qrCodeData?: string;
  transactionId?: string;
  orderId?: string;
  wsUrl?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, loading, clearCart } = useCart();
  const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'idle' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && items.length === 0 && paymentState.status === 'idle') {
      navigate("/cart");
    }
  }, [items, loading, navigate, paymentState.status]);

  // WebSocket listener for payment confirmation
  useEffect(() => {
    if (!paymentState.wsUrl || !paymentState.orderId) return;

    // Ensure we use secure WebSocket (wss://) for HTTPS pages
    let wsUrl = paymentState.wsUrl;
    if (wsUrl.startsWith('ws://') && window.location.protocol === 'https:') {
      wsUrl = wsUrl.replace('ws://', 'wss://');
    }

    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'paid' || data.success) {
          setPaymentState(prev => ({ ...prev, status: 'success' }));
          await clearCart();
          toast.success("Payment successful!");
        }
      };

      ws.onerror = () => {
        // Fall back to polling if WebSocket fails
        startPolling(paymentState.orderId!);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      // Fall back to polling if WebSocket connection fails
      startPolling(paymentState.orderId!);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [paymentState.wsUrl, paymentState.orderId]);

  const startPolling = (orderId: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (data?.status === 'paid') {
        clearInterval(interval);
        setPaymentState(prev => ({ ...prev, status: 'success' }));
        await clearCart();
        toast.success("Payment successful!");
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const parsePrice = (priceStr: string | null | undefined): number => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(numStr) || 0;
  };

  const getCurrency = (priceStr: string | null | undefined): string => {
    if (!priceStr) return 'USD';
    if (priceStr.includes('៛')) return 'KHR';
    return 'USD';
  };

  const totalAmount = items.reduce((sum, item) => {
    const price = parsePrice(item.product?.price);
    return sum + (price * item.quantity);
  }, 0);

  const currency = items[0]?.product?.price ? getCurrency(items[0].product.price) : 'USD';

  const handlePayment = async () => {
    if (!user) return;

    setPaymentState({ status: 'generating' });

    try {
      // Call edge function to generate KHQR and create order
      const { data, error } = await supabase.functions.invoke('khqr-payment', {
        body: {
          action: 'generate-khqr',
          amount: totalAmount,
          currency: currency,
          items: items.map(i => ({
            productId: i.product_id,
            quantity: i.quantity,
            price: parsePrice(i.product?.price),
          })),
        },
      });

      if (error) throw error;

      setPaymentState({
        status: 'pending',
        qrCodeData: data.qrCodeData,
        transactionId: data.transactionId,
        orderId: data.orderId,
        wsUrl: data.wsUrl,
      });

      // Start polling as fallback
      if (data.orderId && !data.wsUrl) {
        startPolling(data.orderId);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Failed to generate payment QR");
      setPaymentState({ status: 'error' });
    }
  };

  const handleViewOrders = () => {
    navigate("/orders");
  };

  // Redirect if not authenticated (after auth is loaded)
  if (!authLoading && !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-card border-b border-gold/20 py-4 px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cart")}
            disabled={paymentState.status === 'pending'}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display gold-text">Checkout</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {paymentState.status === 'success' ? (
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-display text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your order has been confirmed. You can view your purchased items in your orders.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleViewOrders} className="bg-gold text-primary-foreground hover:bg-gold-dark">
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : paymentState.status === 'pending' && paymentState.qrCodeData ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-card border border-gold/20 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="text-foreground">{item.product?.price}</span>
                  </div>
                ))}
                <div className="border-t border-gold/20 pt-2 mt-2 flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-gold">{totalAmount.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-card border border-gold/20 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-4">Scan to Pay with Bakong</h3>
              <div className="bg-card p-4 rounded-lg inline-block mb-4 border border-border">
                <img 
                  src={paymentState.qrCodeData} 
                  alt="Payment QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Transaction ID: {paymentState.transactionId}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for payment...
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setPaymentState({ status: 'idle' })}
              className="w-full"
            >
              Cancel Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-card border border-gold/20 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="text-foreground">{item.product?.price}</span>
                  </div>
                ))}
                <div className="border-t border-gold/20 pt-2 mt-2 flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-gold">{totalAmount.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-gold/20 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-gold/10">
                <QrCode className="h-8 w-8 text-gold" />
                <div>
                  <p className="font-medium text-foreground">Bakong KHQR</p>
                  <p className="text-sm text-muted-foreground">Scan QR code to pay</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={paymentState.status === 'generating'}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark font-display text-lg py-6"
            >
              {paymentState.status === 'generating' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating QR...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" />
                  Pay {totalAmount.toFixed(2)} {currency}
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
