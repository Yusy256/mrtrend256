import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; success: boolean } | null>(null);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleSyncServices = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-services");

      if (error) throw error;

      if (data?.success) {
        setSyncResult({ message: data.message, success: true });
        toast({ title: "Sync Complete", description: data.message });
      } else {
        setSyncResult({ message: data?.error || "Unknown error", success: false });
        toast({ title: "Sync Failed", description: data?.error, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to sync services";
      setSyncResult({ message: msg, success: false });
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground mt-1">Platform configuration</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="font-display">SMM API Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              API credentials are securely stored. Use the sync button below to import services from your SMM provider.
            </p>

            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium font-display">Sync Services</h4>
                  <p className="text-sm text-muted-foreground">
                    Fetch all services from your SMM API and import them into the database
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSyncServices}
                disabled={syncing}
                className="bg-primary text-primary-foreground w-full"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {syncing ? "Syncing..." : "Sync Services from API"}
              </Button>

              {syncResult && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    syncResult.success
                      ? "bg-neon-green/10 text-neon-green"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="font-display">Payment Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Flutterwave Public Key</Label>
              <Input type="password" placeholder="FLWPUBK-..." />
            </div>
            <div className="space-y-2">
              <Label>Flutterwave Secret Key</Label>
              <Input type="password" placeholder="FLWSECK-..." />
            </div>
            <Button variant="outline" className="border-primary text-primary">
              Save Payment Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="font-display">Referral Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Commission Rate (%)</Label>
              <Input type="number" placeholder="10" defaultValue="10" />
            </div>
            <Button variant="outline" className="border-primary text-primary">
              Save Referral Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
