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
    // Pesapal sends IPN as GET with query params
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get("OrderTrackingId");
    const merchantRef = url.searchParams.get("OrderMerchantReference");

    if (!orderTrackingId || !merchantRef) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getPesapalToken();

    // Get transaction status from Pesapal
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const statusData = await statusRes.json();
    console.log("Pesapal transaction status:", JSON.stringify(statusData));

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map Pesapal status codes: 0=Invalid, 1=Completed, 2=Failed, 3=Reversed
    const pesapalStatus = statusData.payment_status_description?.toLowerCase();
    let txStatus: "completed" | "failed" | "pending" = "pending";
    if (pesapalStatus === "completed" || statusData.status_code === 1) {
      txStatus = "completed";
    } else if (pesapalStatus === "failed" || statusData.status_code === 2) {
      txStatus = "failed";
    }

    // Update transaction
    const { data: txData, error: txError } = await adminClient
      .from("transactions")
      .update({
        status: txStatus,
        gateway_response: statusData,
      })
      .eq("reference", merchantRef)
      .select()
      .single();

    if (txError) {
      console.error("Transaction update error:", txError);
      throw new Error(`Failed to update transaction: ${txError.message}`);
    }

    // If completed, credit user balance
    if (txStatus === "completed" && txData) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("balance")
        .eq("user_id", txData.user_id)
        .single();

      if (profile) {
        await adminClient
          .from("profiles")
          .update({ balance: profile.balance + txData.amount })
          .eq("user_id", txData.user_id);
      }
    }

    return new Response(JSON.stringify({
      status: txStatus,
      reference: merchantRef,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pesapal-ipn error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
