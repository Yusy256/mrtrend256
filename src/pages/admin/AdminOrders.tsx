import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, RefreshCw, Trash2, Edit2, Check, X } from "lucide-react";
import { formatUGX } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  pending: "bg-neon-pink/10 text-neon-pink",
  processing: "bg-neon-blue/10 text-neon-blue",
  completed: "bg-neon-green/10 text-neon-green",
  cancelled: "bg-destructive/10 text-destructive",
  partial: "bg-yellow-500/10 text-yellow-500",
};

const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled", "partial"] as const;

const AdminOrders = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, services(name)")
        .order("created_at", { ascending: false });
      
      // Fetch profiles separately since there's no FK
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((o: any) => o.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
        return ordersData.map((o: any) => ({
          ...o,
          profiles: { full_name: profileMap.get(o.user_id) || null },
        }));
      }
      return ordersData || [];
      return ordersData || [];
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Sync statuses from API provider
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-order-status");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        title: "Status sync complete",
        description: `Checked ${data.total || 0} orders, updated ${data.updated || 0}.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  // Update order status
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setEditingId(null);
      toast({ title: "Order updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  // Delete order
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = orders?.filter(
    (o: any) => o.id.includes(search) || o.link?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">All Orders</h1>
            <p className="text-muted-foreground mt-1">{orders?.length || 0} total orders</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sync Status
            </Button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
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
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">User</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Service</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Link</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden xl:table-cell">Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((order: any) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                        <td className="p-4 text-sm hidden sm:table-cell">{order.profiles?.full_name || "—"}</td>
                        <td className="p-4 text-sm hidden md:table-cell">{order.services?.name || "—"}</td>
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
                        <td className="p-4 text-sm font-medium">{formatUGX(order.amount)}</td>
                        <td className="p-4">
                          {editingId === order.id ? (
                            <Select value={editStatus} onValueChange={setEditStatus}>
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                              {order.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {editingId === order.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-neon-green"
                                  onClick={() => updateMutation.mutate({ id: order.id, status: editStatus })}
                                  disabled={updateMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingId(order.id);
                                    setEditStatus(order.status);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete order?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete order #{order.id.slice(0, 8)}. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(order.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
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

export default AdminOrders;
