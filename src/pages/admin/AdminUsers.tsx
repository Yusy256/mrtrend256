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
import { Search, Shield, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatUGX } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          balance: parseFloat(editBalance),
        })
        .eq("id", editUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User profile deleted" });
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditName(user.full_name || "");
    setEditBalance(String(user.balance));
  };

  const filtered = users?.filter(
    (u: any) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.includes(search) ||
      u.phone_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Manage Users</h1>
            <p className="text-muted-foreground mt-1">{users?.length || 0} registered users</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Balance</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Referral Code</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Admin</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((user: any) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-4 text-sm font-medium">{user.full_name || "—"}</td>
                        <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{user.phone_number || "—"}</td>
                        <td className="p-4 text-sm font-medium text-primary">{formatUGX(user.balance)}</td>
                        <td className="p-4 text-sm font-mono text-muted-foreground hidden sm:table-cell">{user.referral_code || "—"}</td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {user.is_admin ? (
                            <Shield className="w-4 h-4 text-primary" />
                          ) : (
                            <span className="text-xs text-muted-foreground">User</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteUserId(user.id)}
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

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
            <DialogDescription>Update user details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Balance (UGX)</Label>
              <Input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
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
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user's profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
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

export default AdminUsers;
