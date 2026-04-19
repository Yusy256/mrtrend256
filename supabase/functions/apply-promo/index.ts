import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { promo_code, user_id } = await req.json();

    if (!promo_code || !user_id) {
      return new Response(JSON.stringify({ error: "Missing promo_code or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate promo code
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promo_code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (promoError || !promo) {
      return new Response(JSON.stringify({ error: "Invalid or inactive promo code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Promo code has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max uses
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return new Response(JSON.stringify({ error: "Promo code has reached max uses" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, balance")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate bonus
    const bonus = promo.discount_type === "fixed"
      ? promo.discount_value
      : (Number(profile.balance) * promo.discount_value) / 100;

    // Apply bonus to user balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: Number(profile.balance) + bonus })
      .eq("id", profile.id);

    if (updateError) throw updateError;

    // Increment used_count
    await supabase
      .from("promo_codes")
      .update({ used_count: promo.used_count + 1 })
      .eq("id", promo.id);

    // Record the transaction
    await supabase.from("transactions").insert({
      user_id,
      amount: bonus,
      type: "deposit",
      status: "completed",
      reference: `PROMO:${promo.code}`,
      payment_method: "promo_code",
    });

    return new Response(
      JSON.stringify({ success: true, bonus, message: `Promo applied! You received ${bonus} UGX bonus.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
