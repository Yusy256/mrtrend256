import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Wallet,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/currency";

const Dashboard = () => {
  const { profile, user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["orders-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, amount, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter((o) => o.status === "completed").length || 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending" || o.status === "processing").length || 0;

  const stats = [
    {
      label: "Balance",
      value: formatUGX(profile?.balance || 0),
      icon: Wallet,
      color: "text-neon-green",
      bg: "bg-neon-green/10",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-neon-blue",
      bg: "bg-neon-blue/10",
    },
    {
      label: "Completed",
      value: completedOrders,
      icon: CheckCircle,
      color: "text-neon-purple",
      bg: "bg-neon-purple/10",
    },
    {
      label: "In Progress",
      value: pendingOrders,
      icon: Clock,
      color: "text-neon-pink",
      bg: "bg-neon-pink/10",
    },
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, <span className="text-gradient">{profile?.full_name || "User"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's your account overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-2">Quick Order</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Boost your social media presence instantly
              </p>
              <Link to="/new-order">
                <Button className="bg-primary text-primary-foreground">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-2">Add Funds</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Top up your wallet to place orders
              </p>
              <Link to="/add-funds">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet. Place your first order!
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatUGX(order.amount)}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "completed"
                            ? "bg-neon-green/10 text-neon-green"
                            : order.status === "processing"
                            ? "bg-neon-blue/10 text-neon-blue"
                            : order.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-neon-pink/10 text-neon-pink"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
