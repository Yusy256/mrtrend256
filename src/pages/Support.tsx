import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Send, Clock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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

const Support = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: tickets, refetch } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject,
        message,
      });
      if (error) throw error;
      toast({ title: "Ticket submitted!", description: "We'll get back to you soon." });
      setSubject("");
      setMessage("");
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to submit ticket.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Support</h1>
          <p className="text-muted-foreground mt-1">Need help? We're here for you</p>
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://wa.me/256744157993"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="glass border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-semibold mb-1">WhatsApp</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Chat now <ExternalLink className="w-3 h-3" />
                </p>
              </CardContent>
            </Card>
          </a>
          <a
            href="https://t.me/mrtrend_support"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="glass border-border/50 hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Send className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-display font-semibold mb-1">Telegram</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Chat now <ExternalLink className="w-3 h-3" />
                </p>
              </CardContent>
            </Card>
          </a>
          <Card className="glass border-border/50">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-accent mx-auto mb-3" />
              <h3 className="font-display font-semibold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">support@mrtrend.com</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit ticket */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Submit a Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="bg-primary text-primary-foreground" disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ticket history */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Your Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {!tickets?.length ? (
                <p className="text-muted-foreground text-sm text-center py-8">No tickets yet</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{t.subject}</h4>
                        <Badge className={`text-xs shrink-0 ${statusColor(t.status)}`}>
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                      {t.admin_reply && (
                        <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Admin Reply
                          </p>
                          <p className="text-xs text-foreground">{t.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
