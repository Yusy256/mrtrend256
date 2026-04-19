import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, CreditCard, Smartphone, Banknote, ArrowDownRight, ArrowUpRight, CheckCircle, Loader2 } from "lucide-react";
import { formatUGX } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

const presetAmounts = [5000, 10000, 25000, 50000, 100000, 500000];

const AddFunds = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Handle callback from Pesapal
  useEffect(() => {
    const ref = searchParams.get("ref");
    const trackingId = searchParams.get("OrderTrackingId");
    if (ref && user) {
      checkPaymentStatus(ref, trackingId || undefined);
    }
  }, [searchParams, user]);

  const checkPaymentStatus = async (reference: string, trackingId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-payment", {
        body: { reference, order_tracking_id: trackingId },
      });
      if (error) throw error;
      if (data?.status === "completed") {
        setPaymentSuccess(true);
        toast({
          title: "Payment Successful!",
          description: `${formatUGX(data.amount)} has been added to your wallet.`,
        });
        refetch();
      } else if (data?.status === "failed") {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Check payment error:", err);
    }
  };

  const handleDeposit = async () => {
    if (!amount || Number(amount) < 1000) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: { amount: Number(amount), payment_method: paymentMethod },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.redirect_url) {
        // Store tracking info for when user returns
        localStorage.setItem("pending_payment", JSON.stringify({
          reference: data.merchant_reference,
          tracking_id: data.order_tracking_id,
        }));
        // Redirect to Pesapal payment page
        window.location.href = data.redirect_url;
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Could not initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Add Funds</h1>
          <p className="text-muted-foreground mt-1">Deposit money to your wallet via Pesapal</p>
        </div>

        {paymentSuccess && (
          <Card className="border-neon-green/50 bg-neon-green/5">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="w-6 h-6 text-neon-green" />
              <div>
                <p className="font-semibold text-neon-green">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">Your wallet has been credited.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-primary font-display">
                  {formatUGX(profile?.balance || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Amount (UGX)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9"
                    min="1000"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    disabled={isProcessing}
                    className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                      amount === String(a)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {formatUGX(a)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className={`text-xs font-medium ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`}>Card</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mobile_money")}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      paymentMethod === "mobile_money"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    }`}
                  >
                    <Smartphone className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === "mobile_money" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className={`text-xs font-medium ${paymentMethod === "mobile_money" ? "text-primary" : "text-muted-foreground"}`}>Mobile Money</p>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={!amount || Number(amount) < 1000 || isProcessing}
                className="w-full bg-primary text-primary-foreground font-semibold h-12"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Deposit {amount ? formatUGX(Number(amount)) : "UGX 0"}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Secured by Pesapal · Card & Mobile Money accepted
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions?.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        {tx.type === "deposit" || tx.type === "referral_bonus" ? (
                          <ArrowDownRight className="w-4 h-4 text-neon-green" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          tx.type === "deposit" || tx.type === "referral_bonus" ? "text-neon-green" : "text-destructive"
                        }`}>
                          {tx.type === "deposit" || tx.type === "referral_bonus" ? "+" : "-"}{formatUGX(tx.amount)}
                        </p>
                        <span className={`text-xs ${
                          tx.status === "completed" ? "text-neon-green" : tx.status === "failed" ? "text-destructive" : "text-neon-pink"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
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

export default AddFunds;
