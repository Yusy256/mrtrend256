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

    const { reference, order_tracking_id } = await req.json();
    if (!reference) throw new Error("Missing reference");

    // Check current transaction status in DB first
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tx } = await adminClient
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .eq("user_id", user.id)
      .single();

    if (!tx) throw new Error("Transaction not found");

    // If already completed, return status
    if (tx.status === "completed") {
      return new Response(JSON.stringify({ status: "completed", amount: tx.amount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have tracking ID, check with Pesapal
    if (order_tracking_id) {
      const token = await getPesapalToken();
      const statusRes = await fetch(
        `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
      );
      const statusData = await statusRes.json();

      const pesapalStatus = statusData.payment_status_description?.toLowerCase();
      let txStatus: "completed" | "failed" | "pending" = "pending";
      if (pesapalStatus === "completed" || statusData.status_code === 1) txStatus = "completed";
      else if (pesapalStatus === "failed" || statusData.status_code === 2) txStatus = "failed";

      if (txStatus !== "pending") {
        await adminClient.from("transactions").update({
          status: txStatus,
          gateway_response: statusData,
        }).eq("reference", reference);

        if (txStatus === "completed") {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("balance")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            await adminClient.from("profiles")
              .update({ balance: profile.balance + tx.amount })
              .eq("user_id", user.id);
          }
        }
      }

      return new Response(JSON.stringify({ status: txStatus, amount: tx.amount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: tx.status, amount: tx.amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
