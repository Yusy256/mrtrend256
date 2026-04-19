import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PESAPAL_BASE = "https://pay.pesapal.com/v3";

async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
      consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

async function registerIPN(token: string): Promise<string> {
  const ipnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pesapal-ipn`;
  // Try to register; Pesapal may return existing
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: "GET",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`IPN registration failed: ${JSON.stringify(data)}`);
  return data.ipn_id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { amount, payment_method } = await req.json();
    if (!amount || Number(amount) < 1000) throw new Error("Minimum deposit is UGX 1,000");

    const token = await getPesapalToken();
    const ipnId = await registerIPN(token);

    // Create a pending transaction
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const merchantRef = `DEP-${Date.now()}-${user.id.slice(0, 8)}`;

    const { error: txError } = await adminClient.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: Number(amount),
      status: "pending",
      payment_method: payment_method || "card",
      reference: merchantRef,
    });
    if (txError) throw new Error(`Transaction creation failed: ${txError.message}`);

    // Submit order to Pesapal
    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: merchantRef,
        currency: "UGX",
        amount: Number(amount),
        description: `Wallet deposit of UGX ${Number(amount).toLocaleString()}`,
        callback_url: `${req.headers.get("origin") || "https://id-preview--34ad2dfe-bf3c-4868-a232-1ef89b00f6c9.lovable.app"}/add-funds?ref=${merchantRef}`,
        notification_id: ipnId,
        billing_address: {
          email_address: user.email,
          phone_number: "",
          first_name: user.user_metadata?.full_name || "",
          last_name: "",
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || orderData.error) {
      throw new Error(`Pesapal order failed: ${JSON.stringify(orderData)}`);
    }

    return new Response(JSON.stringify({
      redirect_url: orderData.redirect_url,
      order_tracking_id: orderData.order_tracking_id,
      merchant_reference: merchantRef,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("initiate-payment error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
