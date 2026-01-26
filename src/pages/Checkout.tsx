import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, QrCode, CheckCircle, Heart, Sparkles, Star } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PaymentState {
  status: 'idle' | 'generating' | 'pending' | 'checking' | 'success' | 'error';
  qrCodeData?: string;
  transactionId?: string;
  orderId?: string;
  wsUrl?: string;
}

// Cute floating sticker component
const FloatingSticker = ({ emoji, className }: { emoji: string; className: string }) => (
  <span className={`absolute text-2xl md:text-3xl animate-float pointer-events-none select-none ${className}`}>
    {emoji}
  </span>
);

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
          toast.success("Payment successful! 🎉");
        }
      };

      ws.onerror = () => {
        startPolling(paymentState.orderId!);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
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
        toast.success("Payment successful! 🎉");
      }
    }, 3000);

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

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 relative overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Cute floating stickers background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingSticker emoji="💖" className="top-[10%] left-[5%]" />
        <FloatingSticker emoji="✨" className="top-[15%] right-[10%] animation-delay-1000" />
        <FloatingSticker emoji="🌸" className="top-[30%] left-[8%] animation-delay-2000" />
        <FloatingSticker emoji="💕" className="top-[45%] right-[5%] animation-delay-500" />
        <FloatingSticker emoji="🎀" className="bottom-[20%] left-[10%] animation-delay-1500" />
        <FloatingSticker emoji="⭐" className="bottom-[30%] right-[8%] animation-delay-3000" />
        <FloatingSticker emoji="🌷" className="top-[60%] left-[3%] animation-delay-2500" />
        <FloatingSticker emoji="💗" className="bottom-[10%] right-[15%] animation-delay-4000" />
      </div>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-200 py-4 px-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cart")}
            disabled={paymentState.status === 'pending'}
            className="hover:bg-pink-100 text-pink-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              Checkout
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md relative z-10">
        {paymentState.status === 'success' ? (
          <div className="text-center py-12 space-y-6">
            {/* Success celebration */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-200 animate-scale-in">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 text-3xl animate-bounce">🎉</span>
              <span className="absolute -bottom-1 -left-2 text-2xl animate-bounce animation-delay-500">💖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Yay! Payment Successful!</h2>
            <p className="text-gray-500">
              Your order is confirmed ✨ Check your orders for details!
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={handleViewOrders} 
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200 rounded-full py-6"
              >
                <Heart className="w-4 h-4 mr-2" />
                View My Orders
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full"
              >
                Continue Shopping 🛍️
              </Button>
            </div>
          </div>
        ) : paymentState.status === 'pending' && paymentState.qrCodeData ? (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-pink-200 rounded-3xl p-5 shadow-lg shadow-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🛒</span>
                <h3 className="font-bold text-gray-800">Order Summary</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">{item.product?.price}</span>
                  </div>
                ))}
                <div className="border-t-2 border-dashed border-pink-200 pt-3 mt-3 flex justify-between font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-pink-600 text-lg">{totalAmount.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-pink-200 rounded-3xl p-6 text-center shadow-lg shadow-pink-100 relative overflow-hidden">
              {/* Decorative corner stickers */}
              <span className="absolute top-3 left-3 text-2xl">💳</span>
              <span className="absolute top-3 right-3 text-2xl">✨</span>
              
              <h3 className="font-bold text-gray-800 mb-2 mt-4">Scan to Pay with Bakong</h3>
              <p className="text-sm text-pink-500 mb-4">🏦 Quick & Secure Payment</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-4 border-2 border-pink-100 shadow-inner">
                <img 
                  src={paymentState.qrCodeData} 
                  alt="Payment QR Code"
                  className="w-56 h-56 md:w-64 md:h-64 object-contain"
                />
              </div>
              
              <p className="text-xs text-gray-500 mb-3 font-mono bg-pink-50 py-2 px-3 rounded-full inline-block">
                ID: {paymentState.transactionId}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-pink-600 bg-pink-50 py-3 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for payment...</span>
                <span className="text-lg">💕</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setPaymentState({ status: 'idle' })}
              className="w-full border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full"
            >
              Cancel Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-pink-200 rounded-3xl p-5 shadow-lg shadow-pink-100 relative overflow-hidden">
              <span className="absolute -top-1 -right-1 text-3xl rotate-12">🌸</span>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🛒</span>
                <h3 className="font-bold text-gray-800">Order Summary</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">{item.product?.price}</span>
                  </div>
                ))}
                <div className="border-t-2 border-dashed border-pink-200 pt-3 mt-3 flex justify-between font-bold">
                  <span className="text-gray-800 flex items-center gap-1">
                    Total <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </span>
                  <span className="text-pink-600 text-lg">{totalAmount.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-pink-200 rounded-3xl p-5 shadow-lg shadow-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💳</span>
                <h3 className="font-bold text-gray-800">Payment Method</h3>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                  <QrCode className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Bakong KHQR</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    Scan QR code to pay <span>📱</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button 
              onClick={handlePayment}
              disabled={paymentState.status === 'generating'}
              className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-600 text-white font-bold text-lg py-7 rounded-full shadow-xl shadow-pink-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {paymentState.status === 'generating' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating QR...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Pay {totalAmount.toFixed(2)} {currency}
                  <span className="text-xl">💖</span>
                </span>
              )}
            </Button>
            
            {/* Cute footer message */}
            <p className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <span>🔒</span> Secure payment powered by Bakong <span>✨</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
