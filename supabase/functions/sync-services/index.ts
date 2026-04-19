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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Verify admin if auth header present
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user }, error: authError } = await userClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await adminClient
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch services from SMM API
    console.log("Fetching services from SMM API...");
    const smmResponse = await fetch(SMM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: SMM_API_KEY, action: "services" }),
    });

    if (!smmResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `SMM API returned ${smmResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smmServices = await smmResponse.json();
    if (!Array.isArray(smmServices)) {
      return new Response(
        JSON.stringify({ success: false, error: "SMM API returned unexpected format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received ${smmServices.length} services from SMM API`);

    // Step 1: Get existing categories (paginated)
    const allExistingCats: any[] = [];
    {
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await adminClient.from("categories").select("id, slug, name").range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allExistingCats.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
    }
    const slugToId = new Map<string, string>();
    const nameToId = new Map<string, string>();
    for (const c of allExistingCats) {
      slugToId.set(c.slug, c.id);
      nameToId.set(c.name, c.id);
    }

    // Step 2: Collect unique category names from API
    const uniqueCatNames = new Set<string>();
    for (const svc of smmServices) {
      uniqueCatNames.add(svc.category || "Uncategorized");
    }

    // Step 3: Insert missing categories, handling duplicate slugs by appending a counter
    let sortIdx = allExistingCats.length;
    const catNameToId = new Map<string, string>(nameToId);

    for (const catName of uniqueCatNames) {
      if (catNameToId.has(catName)) continue;

      // Generate a unique slug
      let baseSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
      let slug = baseSlug;
      let counter = 2;
      while (slugToId.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const { data: inserted, error: catErr } = await adminClient
        .from("categories")
        .insert({ name: catName, slug, icon: guessIcon(catName), sort_order: sortIdx++, is_active: true })
        .select("id, slug")
        .single();

      if (catErr) {
        console.error(`Category insert error for "${catName}":`, catErr.message);
      } else if (inserted) {
        slugToId.set(inserted.slug, inserted.id);
        catNameToId.set(catName, inserted.id);
      }
    }

    const newCatsCount = sortIdx - allExistingCats.length;
    console.log(`Categories: ${newCatsCount} new, ${slugToId.size} total`);

    // Step 4: Get existing services by api_service_id (paginated)
    const existingSvcMap = new Map<string, string>();
    {
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await adminClient.from("services").select("id, api_service_id").range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        for (const s of data) {
          if (s.api_service_id) existingSvcMap.set(s.api_service_id, s.id);
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
    }

    // Step 5: Separate into inserts and updates
    const toInsert: any[] = [];
    const toUpdate: { id: string; data: any }[] = [];
    let skipped = 0;

    for (const svc of smmServices) {
      const catName = svc.category || "Uncategorized";
      const categoryId = catNameToId.get(catName);
      if (!categoryId) {
        skipped++;
        continue;
      }

      const apiServiceId = String(svc.service);
      const serviceData = {
        name: svc.name || `Service ${apiServiceId}`,
        category_id: categoryId,
        price_per_1000: parseFloat(svc.rate) || 0,
        min_quantity: parseInt(svc.min) || 100,
        max_quantity: parseInt(svc.max) || 100000,
        description: svc.description || svc.desc || null,
        is_active: true,
      };

      const existingId = existingSvcMap.get(apiServiceId);
      if (existingId) {
        toUpdate.push({ id: existingId, data: serviceData });
      } else {
        toInsert.push({ ...serviceData, api_service_id: apiServiceId });
      }
    }

    // Batch insert services (50 at a time)
    let servicesCreated = 0;
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { error } = await adminClient.from("services").insert(batch);
      if (error) {
        console.error(`Insert batch error at ${i}:`, error.message);
      } else {
        servicesCreated += batch.length;
      }
    }

    // Batch update services
    let servicesUpdated = 0;
    for (const item of toUpdate) {
      const { error } = await adminClient.from("services").update(item.data).eq("id", item.id);
      if (!error) servicesUpdated++;
    }

    const message = `Sync complete: ${newCatsCount} new categories, ${servicesCreated} new services, ${servicesUpdated} updated, ${skipped} skipped.`;
    console.log(message);

    return new Response(
      JSON.stringify({ success: true, message, stats: { categoriesCreated: newCatsCount, servicesCreated, servicesUpdated, skipped, totalFromApi: smmServices.length } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function guessIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("tiktok")) return "🎵";
  if (lower.includes("instagram")) return "📸";
  if (lower.includes("youtube")) return "🎬";
  if (lower.includes("twitter") || lower.includes("x ")) return "🐦";
  if (lower.includes("facebook")) return "📘";
  if (lower.includes("telegram")) return "✈️";
  if (lower.includes("spotify")) return "🎧";
  if (lower.includes("discord")) return "💬";
  if (lower.includes("twitch")) return "🎮";
  if (lower.includes("snapchat")) return "👻";
  if (lower.includes("linkedin")) return "💼";
  if (lower.includes("pinterest")) return "📌";
  if (lower.includes("reddit")) return "🤖";
  if (lower.includes("thread")) return "🧵";
  if (lower.includes("whatsapp")) return "📱";
  return "🌐";
}
