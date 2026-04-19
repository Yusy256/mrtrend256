import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const statusColors: Record<string, string> = {
  pending: "bg-neon-pink/10 text-neon-pink border-neon-pink/20",
  processing: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
  completed: "bg-neon-green/10 text-neon-green border-neon-green/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const Orders = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, services(name, categories(name))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30s to pick up status changes
  });

  const filtered = orders?.filter(
    (o) =>
      o.id.includes(search) ||
      o.link.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">My Orders</h1>
            <p className="text-muted-foreground mt-1">{orders?.length || 0} total orders</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="glass border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered?.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Link</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((order: any) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                        <td className="p-4 text-sm hidden sm:table-cell">
                          {order.services?.name || "—"}
                        </td>
                        <td className="p-4 text-sm hidden lg:table-cell max-w-[200px] truncate">
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title={order.link}
                          >
                            {order.link}
                          </a>
                        </td>
                        <td className="p-4 text-sm">{order.quantity.toLocaleString()}</td>
                        <td className="p-4 text-sm font-medium">{formatUGX(order.amount)}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
