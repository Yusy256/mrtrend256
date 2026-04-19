import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, Gift, Plus, Edit, Power } from "lucide-react";
import { formatUGX } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminPromos = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editPromo, setEditPromo] = useState<any>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: promos, isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("fixed");
    setDiscountValue("");
    setMaxUses("");
    setExpiresAt("");
  };

  const openCreate = () => {
    resetForm();
    setEditPromo(null);
    setShowCreate(true);
  };

  const openEdit = (promo: any) => {
    setCode(promo.code);
    setDiscountType(promo.discount_type);
    setDiscountValue(String(promo.discount_value));
    setMaxUses(promo.max_uses ? String(promo.max_uses) : "");
    setExpiresAt(promo.expires_at ? promo.expires_at.slice(0, 10) : "");
    setEditPromo(promo);
    setShowCreate(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt || null,
      };
      const { error } = await supabase.from("promo_codes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Promo code created" });
      setShowCreate(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editPromo) return;
      const payload: any = {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt || null,
      };
      const { error } = await supabase.from("promo_codes").update(payload).eq("id", editPromo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Promo code updated" });
      setShowCreate(false);
      setEditPromo(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promo_codes").update({ is_active: !is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Promo code status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim() || !discountValue) {
      toast({ title: "Please fill in code and discount value", variant: "destructive" });
      return;
    }
    if (editPromo) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const filtered = promos?.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Promo Codes</h1>
            <p className="text-muted-foreground mt-1">{promos?.length || 0} promo codes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search codes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground shrink-0">
              <Plus className="w-4 h-4 mr-2" /> New Code
            </Button>
          </div>
        </div>

        <Card className="glass border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : promos?.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No promo codes yet</p>
                <Button onClick={openCreate} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Create your first promo code
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Code</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Discount</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Uses</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Expires</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((promo) => (
                      <tr key={promo.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-mono font-bold text-primary">{promo.code}</td>
                        <td className="p-4 text-sm">
                          {promo.discount_type === "percentage" ? `${promo.discount_value}%` : formatUGX(promo.discount_value)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                          {promo.used_count}{promo.max_uses ? `/${promo.max_uses}` : ""}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${promo.is_active ? "bg-neon-green/10 text-neon-green" : "bg-destructive/10 text-destructive"}`}>
                            {promo.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(promo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 ${promo.is_active ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-neon-green"}`}
                              onClick={() => toggleMutation.mutate({ id: promo.id, is_active: promo.is_active })}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
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

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditPromo(null); resetForm(); } }}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">{editPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            <DialogDescription>{editPromo ? "Update promo code details below." : "Set up a new promo code for users."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="e.g. WELCOME50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(v: "fixed" | "percentage") => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (UGX)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  placeholder={discountType === "fixed" ? "e.g. 5000" : "e.g. 10"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses (optional)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires On (optional)</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditPromo(null); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-primary text-primary-foreground"
              >
                {isPending ? "Saving..." : editPromo ? "Save Changes" : "Create Code"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPromos;
