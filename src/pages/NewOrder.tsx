import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ShoppingCart, Link as LinkIcon, Hash, Banknote } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const platformIcons: Record<string, string> = {
  tiktok: "🎵",
  instagram: "📸",
  youtube: "🎬",
  twitter: "🐦",
  facebook: "📘",
  telegram: "✈️",
  spotify: "🎧",
};

const NewOrder = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services", categoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!categoryId,
  });

  const selectedService = services?.find((s) => s.id === serviceId);
  const totalCost = selectedService
    ? (Number(selectedService.price_per_1000) * Number(quantity || 0)) / 1000
    : 0;

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !user) throw new Error("Missing data");
      if (totalCost > Number(profile?.balance || 0)) {
        throw new Error("Insufficient balance. Please add funds.");
      }

      // Deduct balance first
      const newBalance = Number(profile?.balance || 0) - totalCost;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("user_id", user.id);
      if (balanceError) throw new Error("Failed to deduct balance: " + balanceError.message);

      // Create order in DB
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        service_id: selectedService.id,
        link,
        quantity: Number(quantity),
        amount: totalCost,
        status: "pending",
      }).select().single();
      if (error) {
        // Rollback balance
        await supabase.from("profiles").update({ balance: Number(profile?.balance || 0) }).eq("user_id", user.id);
        throw error;
      }

      // Send to SMM API (will silently fail if API not configured)
      try {
        if (selectedService.api_service_id) {
          await supabase.functions.invoke("smm-api", {
            body: {
              action: "order",
              service_id: selectedService.api_service_id,
              link,
              quantity: Number(quantity),
              order_id: order.id,
            },
          });
        }
      } catch {
        // API not configured yet, order stays as pending
      }
    },
    onSuccess: () => {
      toast({ title: "Order placed!", description: "Your order has been submitted successfully." });
      setLink("");
      setQuantity("");
      setServiceId("");
      queryClient.invalidateQueries({ queryKey: ["orders-stats"] });
      refreshProfile();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display">New Order</h1>
          <p className="text-muted-foreground mt-1">Select a service and place your order</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Select Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setServiceId(""); }}>
              <SelectTrigger className="h-auto min-h-10">
                <SelectValue placeholder="Choose a platform" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false} className="max-h-[40vh]">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {platformIcons[cat.slug] || "🌐"} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {categoryId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Service</Label>
                   <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger className="h-auto min-h-10">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" avoidCollisions={false} className="max-w-[calc(100vw-3rem)] max-h-[40vh]">
                      {services?.map((svc) => (
                        <SelectItem key={svc.id} value={svc.id} className="whitespace-normal">
                          <span className="line-clamp-2">{svc.name} — {formatUGX(svc.price_per_1000)}/1K</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedService?.description && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                    {selectedService.description}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Quantity{" "}
                    {selectedService && (
                      <span className="text-muted-foreground text-xs">
                        (Min: {selectedService.min_quantity} — Max: {selectedService.max_quantity})
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="1000"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="pl-9"
                      min={selectedService?.min_quantity}
                      max={selectedService?.max_quantity}
                    />
                  </div>
                </div>

                {totalCost > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary" />
                      <span className="font-medium">Total Cost</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {formatUGX(totalCost)}
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => orderMutation.mutate()}
                  disabled={
                    !serviceId ||
                    !link ||
                    !quantity ||
                    orderMutation.isPending ||
                    totalCost <= 0
                  }
                  className="w-full bg-primary text-primary-foreground font-semibold h-12"
                >
                  {orderMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Place Order — {formatUGX(totalCost)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewOrder;
