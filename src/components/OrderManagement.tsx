import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_account_id: string | null;
  product_file_id: string | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    image_url: string;
  };
  product_account?: {
    account_details: string[];
  };
  product_file?: {
    file_name: string;
  };
  user_email?: string;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:products(name, image_url),
        product_account:product_accounts(account_details),
        product_file:product_files(file_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
    } else {
      // Fetch user emails
      const ordersWithEmails = await Promise.all(
        (data || []).map(async (order) => {
          // We can't directly query auth.users, so we show user_id
          return { ...order, user_email: order.user_id.slice(0, 8) + "..." };
        })
      );
      setOrders(ordersWithEmails);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      // If marking as paid and it's an account product, mark account as sold
      const order = orders.find(o => o.id === orderId);
      if (newStatus === "paid" && order?.product_account_id) {
        await supabase
          .from("product_accounts")
          .update({ 
            is_sold: true, 
            sold_to_user_id: order.user_id,
            sold_at: new Date().toISOString()
          })
          .eq("id", order.product_account_id);
      }
      
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-600 text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case "refunded":
        return <Badge className="bg-amber-600 text-primary-foreground"><RefreshCw className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge className="bg-amber-500 text-primary-foreground"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-foreground hover:bg-gold/10 gap-2">
          <ClipboardList className="w-4 h-4" />
          Orders
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display">Order Management</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by transaction ID, product, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-input border-gold/30 text-foreground"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-input border-gold/30 text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-gold/30">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchOrders}
            className="border-gold/30 hover:bg-gold/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20">
                  <TableHead className="text-gold">Date</TableHead>
                  <TableHead className="text-gold">Transaction</TableHead>
                  <TableHead className="text-gold">Product</TableHead>
                  <TableHead className="text-gold">Amount</TableHead>
                  <TableHead className="text-gold">Status</TableHead>
                  <TableHead className="text-gold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-gold/10 hover:bg-gold/5">
                    <TableCell className="text-foreground text-sm">
                      {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-foreground font-mono text-xs">
                      {order.transaction_id || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.product?.image_url && (
                          <img 
                            src={order.product.image_url} 
                            alt="" 
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className="text-foreground text-sm truncate max-w-[150px]">
                          {order.product?.name || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gold font-semibold">
                      {order.amount} {order.currency}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          className="text-foreground hover:text-gold"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "paid")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, "cancelled")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {order.status === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, "refunded")}
                            className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="bg-card border-gold/30">
              <DialogHeader>
                <DialogTitle className="gold-text">Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <p className="text-foreground font-mono">{selectedOrder.transaction_id || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>{getStatusBadge(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="text-gold font-semibold">{selectedOrder.amount} {selectedOrder.currency}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="text-foreground">{format(new Date(selectedOrder.created_at), "PPpp")}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">User ID:</span>
                    <p className="text-foreground font-mono text-xs break-all">{selectedOrder.user_id}</p>
                  </div>
                </div>
                
                {selectedOrder.product && (
                  <div className="border-t border-gold/20 pt-4">
                    <span className="text-muted-foreground text-sm">Product:</span>
                    <div className="flex items-center gap-3 mt-2">
                      <img 
                        src={selectedOrder.product.image_url} 
                        alt="" 
                        className="w-16 h-16 rounded object-cover"
                      />
                      <span className="text-foreground font-semibold">{selectedOrder.product.name}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.product_account && (
                  <div className="border-t border-gold/20 pt-4">
                    <span className="text-muted-foreground text-sm">Account Details:</span>
                    <div className="mt-2 p-3 bg-input rounded-md">
                      {selectedOrder.product_account.account_details.map((detail, i) => (
                        <p key={i} className="text-foreground font-mono text-sm">{detail}</p>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.product_file && (
                  <div className="border-t border-gold/20 pt-4">
                    <span className="text-muted-foreground text-sm">File:</span>
                    <p className="text-foreground">{selectedOrder.product_file.file_name}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
