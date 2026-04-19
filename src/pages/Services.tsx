import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Package, Menu } from "lucide-react";
import { formatUGX } from "@/lib/currency";

const Services = () => {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
      return data || [];
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["all-services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*, categories(name, slug)").eq("is_active", true);
      return data || [];
    },
  });

  const filtered = services?.filter((s: any) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCat || s.category_id === activeCat;
    return matchSearch && matchCat;
  });

  // Group filtered services by category
  const grouped: Record<string, { catName: string; services: any[] }> = {};
  filtered?.forEach((svc: any) => {
    const catName = svc.categories?.name || "Other";
    const catId = svc.category_id || "other";
    if (!grouped[catId]) grouped[catId] = { catName, services: [] };
    grouped[catId].services.push(svc);
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold font-display">Services</h1>
          <p className="text-muted-foreground mt-1">Browse all available services</p>
        </div>

        {/* Platform filter grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveCat(null)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
              !activeCat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <Menu className="h-4 w-4" />
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all truncate ${
                activeCat === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat.icon && <span className="text-base">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Service</span>
          <span className="w-28 text-right">Rate per 1000</span>
          <span className="w-20 text-right">Min</span>
          <span className="w-20 text-right">Max</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No services found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([catId, { catName, services: svcs }]) => (
              <div key={catId}>
                {/* Category header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg mb-1">
                  <h2 className="text-sm font-bold font-display text-primary">{catName}</h2>
                  <span className="text-xs text-muted-foreground">({svcs.length})</span>
                </div>

                {/* Services rows */}
                <div className="divide-y divide-border/50">
                  {svcs.map((svc: any) => (
                    <div
                      key={svc.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 px-4 py-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{svc.description}</p>
                        )}
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-sm font-semibold text-primary">{formatUGX(svc.price_per_1000)}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs text-muted-foreground">{svc.min_quantity.toLocaleString()}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs text-muted-foreground">{svc.max_quantity.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Services;
