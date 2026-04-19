import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const AdminAnalytics = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: stats } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [ordersRes, profilesRes, transactionsRes] = await Promise.all([
        supabase.from("orders").select("id, amount, status, created_at"),
        supabase.from("profiles").select("id, balance"),
        supabase.from("transactions").select("id, amount, status, type"),
      ]);

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
      const completedOrders = orders.filter((o) => o.status === "completed").length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const processingOrders = orders.filter((o) => o.status === "processing").length;
      const totalUsers = profiles.length;
      const totalBalance = profiles.reduce((sum, p) => sum + Number(p.balance), 0);
      const totalDeposits = transactions
        .filter((t) => t.type === "deposit" && t.status === "completed")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Orders by status
      const statusCounts: Record<string, number> = {};
      orders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      return {
        totalOrders: orders.length,
        totalRevenue,
        completedOrders,
        pendingOrders,
        processingOrders,
        totalUsers,
        totalBalance,
        totalDeposits,
        statusCounts,
      };
    },
  });

  const cards = [
    { title: "Total Revenue", value: formatUGX(stats?.totalRevenue || 0), icon: DollarSign, color: "text-neon-green" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-neon-blue" },
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-neon-purple" },
    { title: "Total Deposits", value: formatUGX(stats?.totalDeposits || 0), icon: TrendingUp, color: "text-neon-pink" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-neon-pink/20 text-neon-pink",
    processing: "bg-neon-blue/20 text-neon-blue",
    completed: "bg-neon-green/20 text-neon-green",
    cancelled: "bg-destructive/20 text-destructive",
    partial: "bg-yellow-500/20 text-yellow-500",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform performance and insights</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.title} className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <p className="text-lg font-bold font-display">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Orders by Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats?.statusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-sm px-3 py-1 rounded-full ${statusColors[status] || "bg-secondary text-foreground"}`}>
                    {status}
                  </span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
              {!stats?.totalOrders && (
                <p className="text-muted-foreground text-center py-4">No orders yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Balance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Total User Balances</span>
                <span className="font-bold text-neon-green">{formatUGX(stats?.totalBalance || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Completed Orders Value</span>
                <span className="font-bold">{formatUGX(stats?.totalRevenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Pending Orders</span>
                <span className="font-bold text-neon-pink">{stats?.pendingOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Processing Orders</span>
                <span className="font-bold text-neon-blue">{stats?.processingOrders || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
