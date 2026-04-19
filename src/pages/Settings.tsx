import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Moon, Sun, Monitor, Mail, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  // Local state for notifications to mock preferences
  const [emailNotifs, setEmailNotifs] = useState(
    () => localStorage.getItem("emailNotifs") !== "false"
  );
  const [pushNotifs, setPushNotifs] = useState(
    () => localStorage.getItem("pushNotifs") === "true"
  );
  const [marketingNotifs, setMarketingNotifs] = useState(
    () => localStorage.getItem("marketingNotifs") === "true"
  );

  useEffect(() => {
    localStorage.setItem("emailNotifs", String(emailNotifs));
    localStorage.setItem("pushNotifs", String(pushNotifs));
    localStorage.setItem("marketingNotifs", String(marketingNotifs));
  }, [emailNotifs, pushNotifs, marketingNotifs]);

  const handleToggle = (setting: string) => {
    toast({
      title: "Settings updated",
      description: `Your ${setting} preferences have been saved.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your app preferences and notification settings.
          </p>
        </div>

        {/* Appearance */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Monitor className="w-5 h-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>
              Customize how Mr Trend looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>
              Choose what updates you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your order status and account updates.
                  </p>
                </div>
              </div>
              <Switch
                checked={emailNotifs}
                onCheckedChange={(checked) => {
                  setEmailNotifs(checked);
                  handleToggle("email notification");
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-4">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications inside the app for quick updates.
                  </p>
                </div>
              </div>
              <Switch
                checked={pushNotifs}
                onCheckedChange={(checked) => {
                  setPushNotifs(checked);
                  handleToggle("push notification");
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features, promos, and offers.
                  </p>
                </div>
              </div>
              <Switch
                checked={marketingNotifs}
                onCheckedChange={(checked) => {
                  setMarketingNotifs(checked);
                  handleToggle("marketing");
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
