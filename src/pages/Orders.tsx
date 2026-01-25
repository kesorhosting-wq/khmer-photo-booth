import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Package, Download, Eye, Copy, Check } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order } from "@/types/shop";

const Orders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [accountDetails, setAccountDetails] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:products(id, name, image_url, price, category_id),
        product_account:product_accounts(id, account_details),
        product_file:product_files(id, file_url, file_name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      // Map to Order type
      const mappedOrders: Order[] = (data || []).map((order) => ({
        id: order.id,
        user_id: order.user_id,
        product_id: order.product_id,
        product_account_id: order.product_account_id,
        product_file_id: order.product_file_id,
        transaction_id: order.transaction_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status as Order['status'],
        created_at: order.created_at,
        updated_at: order.updated_at,
        product: order.product,
        product_account: order.product_account ? {
          ...order.product_account,
          product_id: order.product_id,
          is_sold: true,
          sold_to_user_id: order.user_id,
          sold_at: order.created_at,
          created_at: order.created_at,
        } : undefined,
        product_file: order.product_file ? {
          ...order.product_file,
          product_id: order.product_id,
          file_size: null,
          created_at: order.created_at,
        } : undefined,
      }));
      setOrders(mappedOrders);
    }
    setLoading(false);
  };

  const handleViewAccount = async (order: Order) => {
    if (!order.product_account_id) return;

    const { data } = await supabase
      .from("product_accounts")
      .select("account_details")
      .eq("id", order.product_account_id)
      .single();

    if (data) {
      setAccountDetails(data.account_details);
      setSelectedOrder(order);
    }
  };

  const handleDownloadFile = async (order: Order) => {
    if (!order.product_file_id) {
      toast.error("File not available");
      return;
    }

    // Get signed URL from edge function
    const { data, error } = await supabase.functions.invoke('download-file', {
      body: { orderId: order.id, fileId: order.product_file_id },
    });

    if (error || !data?.url) {
      toast.error("Failed to get download link");
      return;
    }

    // Open download in new tab
    window.open(data.url, '_blank');
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
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
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display gold-text">My Orders</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-display text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here!</p>
            <Button onClick={() => navigate("/")} className="bg-gold text-primary-foreground hover:bg-gold-dark">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-card border border-gold/20 rounded-lg p-4"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={order.product?.image_url} 
                      alt={order.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {order.product?.name}
                    </h3>
                    <p className="text-gold font-bold text-sm">
                      {order.amount} {order.currency}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === 'paid' && (
                    <div className="flex flex-col gap-2">
                      {order.product_account_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAccount(order)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      {order.product_file_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(order)}
                          className="gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Account Details Dialog */}
      <Dialog open={!!selectedOrder && !!accountDetails} onOpenChange={() => { setSelectedOrder(null); setAccountDetails(null); }}>
        <DialogContent className="max-w-md bg-card border-gold/30">
          <DialogHeader>
            <DialogTitle className="gold-text font-display">
              Account Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Product: {selectedOrder?.product?.name}
            </p>
            <div className="space-y-2">
              {accountDetails?.map((detail, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-gold/10"
                >
                  <span className="text-foreground text-sm break-all pr-2">{detail}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => copyToClipboard(detail, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
