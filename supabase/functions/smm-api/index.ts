import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SMM_API_URL = Deno.env.get("SMM_API_URL");
    const SMM_API_KEY = Deno.env.get("SMM_API_KEY");

    if (!SMM_API_URL || !SMM_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "SMM API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, service_id, link, quantity, order_id } = await req.json();

    if (action === "order") {
      // Place order with SMM provider
      const smmResponse = await fetch(SMM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SMM_API_KEY,
          action: "add",
          service: service_id,
          link,
          quantity,
        }),
      });

      const result = await smmResponse.json();
      console.log("SMM order response:", JSON.stringify(result));

      // Update order with API response
      if (order_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, supabaseKey);

        const updateData: Record<string, unknown> = {
          api_response: result,
        };

        if (result.order) {
          updateData.api_order_id = String(result.order);
          updateData.status = "processing";
        } else if (result.error) {
          updateData.status = "cancelled";
        }

        await adminClient.from("orders").update(updateData).eq("id", order_id);
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      // Check order status
      const smmResponse = await fetch(SMM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SMM_API_KEY,
          action: "status",
          order: order_id,
        }),
      });

      const result = await smmResponse.json();
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SMM API error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
