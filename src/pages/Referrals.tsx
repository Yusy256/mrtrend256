import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Users, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatUGX } from "@/lib/currency";

const Referrals = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code || ""}`;

  const { data: referrals } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalEarnings = referrals?.reduce((sum, r) => sum + Number(r.bonus_amount), 0) || 0;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Referral Program</h1>
          <p className="text-muted-foreground mt-1">Invite friends and earn commissions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold font-display">{referrals?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Referrals</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Banknote className="w-8 h-8 text-neon-green mx-auto mb-2" />
              <p className="text-2xl font-bold font-display">{formatUGX(totalEarnings)}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold font-display">10%</p>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant="outline" className="border-primary text-primary">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with friends. When they sign up and make a deposit, you earn 10% commission!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Referrals;
