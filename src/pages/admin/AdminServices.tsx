import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatUGX } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

const AdminServices = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editSvc, setEditSvc] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editCatId, setEditCatId] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editDesc, setEditDesc] = useState("");
  const [deleteSvcId, setDeleteSvcId] = useState<string | null>(null);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const allServices: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase
          .from("services")
          .select("*, categories(name)")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allServices.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allServices;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editSvc) return;
      const { error } = await supabase
        .from("services")
        .update({
          name: editName,
          price_per_1000: parseFloat(editPrice),
          min_quantity: parseInt(editMin),
          max_quantity: parseInt(editMax),
          category_id: editCatId,
          is_active: editActive,
          description: editDesc || null,
        })
        .eq("id", editSvc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Service updated" });
      setEditSvc(null);
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Service deleted" });
      setDeleteSvcId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (svc: any) => {
    setEditSvc(svc);
    setEditName(svc.name);
    setEditPrice(String(svc.price_per_1000));
    setEditMin(String(svc.min_quantity));
    setEditMax(String(svc.max_quantity));
    setEditCatId(svc.category_id);
    setEditActive(svc.is_active);
    setEditDesc(svc.description || "");
  };

  const filtered = services?.filter(
    (s: any) => s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Manage Services</h1>
            <p className="text-muted-foreground mt-1">{services?.length || 0} services</p>
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card className="glass border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Price/1K</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Min/Max</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Active</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((svc: any) => (
                      <tr key={svc.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-medium">{svc.name}</td>
                        <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{svc.categories?.name || "—"}</td>
                        <td className="p-4 text-sm font-medium text-primary">{formatUGX(svc.price_per_1000)}</td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {svc.min_quantity} / {svc.max_quantity.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${svc.is_active ? "bg-neon-green/10 text-neon-green" : "bg-destructive/10 text-destructive"}`}>
                            {svc.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(svc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteSvcId(svc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Edit Service Dialog */}
      <Dialog open={!!editSvc} onOpenChange={(open) => !open && setEditSvc(null)}>
        <DialogContent className="glass border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCatId} onValueChange={setEditCatId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price per 1000 (UGX)</Label>
              <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Quantity</Label>
                <Input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity</Label>
                <Input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditSvc(null)}>Cancel</Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSvcId} onOpenChange={(open) => !open && setDeleteSvcId(null)}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSvcId && deleteMutation.mutate(deleteSvcId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminServices;
