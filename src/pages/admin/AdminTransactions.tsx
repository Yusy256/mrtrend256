import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const statusColors: Record<string, string> = {
  pending: "bg-neon-pink/10 text-neon-pink border-neon-pink/20",
  completed: "bg-neon-green/10 text-neon-green border-neon-green/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const typeColors: Record<string, string> = {
  deposit: "text-neon-green",
  deduction: "text-neon-pink",
  refund: "text-neon-blue",
  referral_bonus: "text-neon-purple",
};

const AdminTransactions = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = transactions?.filter(
    (t: any) =>
      t.id.includes(search) ||
      t.reference?.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">
              All <span className="text-gradient">Transactions</span>
            </h1>
            <p className="text-muted-foreground mt-1">{transactions?.length || 0} total transactions</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
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
              <p className="text-muted-foreground text-center py-12">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Reference</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-mono">#{tx.id.slice(0, 8)}</td>
                        <td className={`p-4 text-sm font-medium capitalize ${typeColors[tx.type] || ""}`}>
                          {tx.type.replace("_", " ")}
                        </td>
                        <td className="p-4 text-sm font-medium">{formatUGX(tx.amount)}</td>
                        <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell capitalize">
                          {tx.payment_method || "—"}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell font-mono">
                          {tx.reference?.slice(0, 16) || "—"}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[tx.status] || ""}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(tx.created_at).toLocaleDateString()}
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

export default AdminTransactions;
