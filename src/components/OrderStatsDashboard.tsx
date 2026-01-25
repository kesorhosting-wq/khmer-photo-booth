import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Package,
  RefreshCw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageOrderValue: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
}

const CHART_COLORS = {
  primary: "hsl(var(--gold))",
  secondary: "hsl(var(--gold-light))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#6b7280",
};

const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

export const OrderStatsDashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
    averageOrderValue: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    if (dialogOpen) {
      fetchStats();
    }
  }, [dialogOpen, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    const days = parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString();
    const endDate = endOfDay(new Date()).toISOString();

    try {
      // Fetch all orders within date range
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          product:products(name)
        `)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const allOrders = orders || [];

      // Calculate stats
      const totalOrders = allOrders.length;
      const paidOrders = allOrders.filter(o => o.status === "paid");
      const pendingOrders = allOrders.filter(o => o.status === "pending");
      const cancelledOrders = allOrders.filter(o => o.status === "cancelled");
      const refundedOrders = allOrders.filter(o => o.status === "refunded");
      
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0);
      const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        paidOrders: paidOrders.length,
        cancelledOrders: cancelledOrders.length,
        refundedOrders: refundedOrders.length,
        averageOrderValue,
      });

      // Calculate daily revenue
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "MMM dd");
        dailyMap.set(date, { revenue: 0, orders: 0 });
      }

      paidOrders.forEach(order => {
        const date = format(new Date(order.created_at), "MMM dd");
        const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
        dailyMap.set(date, {
          revenue: existing.revenue + Number(order.amount),
          orders: existing.orders + 1,
        });
      });

      setDailyRevenue(
        Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          ...data,
        }))
      );

      // Calculate top products
      const productMap = new Map<string, { sales: number; revenue: number }>();
      paidOrders.forEach(order => {
        const productName = order.product?.name || "Unknown";
        const existing = productMap.get(productName) || { sales: 0, revenue: 0 };
        productMap.set(productName, {
          sales: existing.sales + 1,
          revenue: existing.revenue + Number(order.amount),
        });
      });

      const sortedProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: "Paid", value: stats.paidOrders, color: CHART_COLORS.success },
    { name: "Pending", value: stats.pendingOrders, color: CHART_COLORS.warning },
    { name: "Cancelled", value: stats.cancelledOrders, color: CHART_COLORS.danger },
    { name: "Refunded", value: stats.refundedOrders, color: CHART_COLORS.muted },
  ].filter(d => d.value > 0);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-foreground hover:bg-gold/10 gap-2">
          <BarChart3 className="w-4 h-4" />
          Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="gold-text text-xl font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Order Statistics
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px] bg-input border-gold/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-gold/30">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchStats}
                className="border-gold/30 hover:bg-gold/10"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gold">
                      ${stats.totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {stats.paidOrders} paid orders
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-gold" />
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalOrders}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      In the last {dateRange} days
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gold">
                      {stats.pendingOrders}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting payment
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      Avg. Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gold">
                      ${stats.averageOrderValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per paid order
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="bg-card/50 border-gold/20 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-foreground text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      Daily Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--gold) / 0.3)",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                          />
                          <Bar 
                            dataKey="revenue" 
                            fill="hsl(var(--gold))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Pie Chart */}
                <Card className="bg-card/50 border-gold/20">
                  <CardHeader>
                    <CardTitle className="text-foreground text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      Order Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--gold) / 0.3)",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-sm">No order data</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.name}: {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card className="bg-card/50 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold" />
                    Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gold font-bold w-6">#{index + 1}</span>
                            <span className="text-foreground truncate max-w-[200px]">
                              {product.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {product.sales} sales
                            </span>
                            <span className="text-gold font-semibold">
                              ${product.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No sales data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Orders Trend */}
              <Card className="bg-card/50 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gold" />
                    Orders Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--gold) / 0.3)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="orders" 
                          stroke="hsl(var(--gold))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--gold))", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
