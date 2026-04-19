import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Send, Trash2, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusColor = (status: string) => {
  switch (status) {
    case "open": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "replied": return "bg-primary/20 text-primary border-primary/30";
    case "closed": return "bg-muted text-muted-foreground border-border";
    default: return "";
  }
};

const AdminTickets = () => {
  const [search, setSearch] = useState("");
  const [replyTicket, setReplyTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: tickets, refetch } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, profiles!support_tickets_user_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) {
        // fallback without join
        const { data: d2, error: e2 } = await supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false });
        if (e2) throw e2;
        return d2;
      }
      return data;
    },
  });

  // Real-time notifications for new tickets
  useEffect(() => {
    const channel = supabase
      .channel('admin-ticket-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        (payload) => {
          toast({
            title: "🔔 New Support Ticket",
            description: `"${(payload.new as any).subject}" — tap to view`,
          });
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
        () => refetch()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast, refetch]);

  const handleReply = async () => {
    if (!replyTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          admin_reply: replyText,
          status: "replied",
          replied_at: new Date().toISOString(),
        })
        .eq("id", replyTicket.id);
      if (error) throw error;
      toast({ title: "Reply sent" });
      setReplyTicket(null);
      setReplyText("");
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to reply.", variant: "destructive" });
    } finally {
      setReplying(false);
    }
  };

  const handleClose = async (id: string) => {
    await supabase.from("support_tickets").update({ status: "closed" }).eq("id", id);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("support_tickets").delete().eq("id", id);
    toast({ title: "Ticket deleted" });
    refetch();
  };

  const filtered = (tickets || []).filter((t: any) => {
    const matchSearch =
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: tickets?.length || 0,
    open: tickets?.filter((t: any) => t.status === "open").length || 0,
    replied: tickets?.filter((t: any) => t.status === "replied").length || 0,
    closed: tickets?.filter((t: any) => t.status === "closed").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage user support requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["all", "open", "replied", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`p-3 rounded-lg border text-center transition-all ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <p className="text-2xl font-bold">{counts[s]}</p>
              <p className="text-xs capitalize">{s}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tickets */}
        <div className="space-y-3">
          {!filtered.length ? (
            <Card className="glass border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                No tickets found
              </CardContent>
            </Card>
          ) : (
            filtered.map((t: any) => (
              <Card key={t.id} className="glass border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{t.subject}</h3>
                        <Badge className={`text-xs ${statusColor(t.status)}`}>{t.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                        <span>User: {t.profiles?.full_name || t.user_id?.slice(0, 8)}</span>
                      </div>
                      {t.admin_reply && (
                        <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                          <p className="text-xs text-primary font-medium mb-1">Your reply:</p>
                          <p className="text-xs">{t.admin_reply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setReplyTicket(t); setReplyText(t.admin_reply || ""); }}
                      >
                        <Send className="w-3 h-3 mr-1" /> Reply
                      </Button>
                      {t.status !== "closed" && (
                        <Button size="sm" variant="ghost" onClick={() => handleClose(t.id)}>
                          <XCircle className="w-3 h-3 mr-1" /> Close
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Reply dialog */}
      <Dialog open={!!replyTicket} onOpenChange={() => setReplyTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to: {replyTicket?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded bg-secondary/50 text-sm">{replyTicket?.message}</div>
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
            <Button onClick={handleReply} disabled={replying || !replyText.trim()} className="bg-primary text-primary-foreground">
              <Send className="w-4 h-4 mr-2" />
              {replying ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTickets;
