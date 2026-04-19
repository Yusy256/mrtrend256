import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, ShoppingCart, Banknote, TrendingUp, Package } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ordersRes, usersRes, servicesRes] = await Promise.all([
        supabase.from("orders").select("id, amount, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("services").select("id", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);

      return {
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalServices: servicesRes.count || 0,
        totalRevenue,
        completedOrders: orders.filter((o) => o.status === "completed").length,
        pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
      };
    },
  });

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-neon-green", bg: "bg-neon-green/10" },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-neon-blue", bg: "bg-neon-blue/10" },
    { label: "Revenue", value: formatUGX(stats?.totalRevenue || 0), icon: Banknote, color: "text-neon-purple", bg: "bg-neon-purple/10" },
    { label: "Services", value: stats?.totalServices || 0, icon: Package, color: "text-neon-pink", bg: "bg-neon-pink/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass border-border/50">
                <CardContent className="p-4 lg:p-6">
                  <div className={`p-2 rounded-lg ${card.bg} w-fit mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold font-display">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass border-border/50">
            <CardHeader><CardTitle className="font-display">Pending Orders</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-neon-pink">{stats?.pendingOrders || 0}</p>
              <p className="text-sm text-muted-foreground">Orders awaiting processing</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardHeader><CardTitle className="font-display">Completed Orders</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-neon-green">{stats?.completedOrders || 0}</p>
              <p className="text-sm text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
