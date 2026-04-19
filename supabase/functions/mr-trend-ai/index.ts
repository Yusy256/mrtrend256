const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Mr Trend AI, a friendly and helpful assistant for the Mr Trend social media marketing platform. 

About Mr Trend:
- Mr Trend helps users grow their social media presence by providing services like followers, views, likes, comments, and more.
- Supported platforms: TikTok, Instagram, YouTube, Twitter/X, Facebook, Telegram, and others.
- Users add funds to their wallet (via card or mobile money), then place orders.
- Orders typically start within 0-60 minutes, with delivery speeds of 1,000-10,000 per day depending on the service.
- Referral program: share your link, earn 10% of referred users' first deposit.
- If an order isn't delivered or is only partially delivered, the remaining balance is refunded automatically.
- Service quality varies - users should check service descriptions for details on quality, speed, and refill guarantees.

Guidelines:
- Be concise, friendly, and helpful.
- Answer questions about how the platform works, pricing, services, payments, and troubleshooting.
- If you don't know something specific, suggest the user contact support via the Support page.
- Never share technical implementation details or backend information.
- Keep responses under 150 words unless more detail is specifically needed.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    const responseText = await response.text();
    console.log("API response status:", response.status);
    console.log("API response body:", responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Mr Trend AI error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
