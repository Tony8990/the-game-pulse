import { useState } from "react";
import { Loader2, RefreshCw, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ConsoleDealCard from "./ConsoleDealCard";

const PLATFORMS = [
  { id: "ps5", label: "PlayStation", emoji: "🎮" },
  { id: "xbox", label: "Xbox", emoji: "🟢" },
  { id: "nintendo", label: "Nintendo", emoji: "🔴" },
];

const PLATFORM_STORES = {
  ps5: "PlayStation Store",
  xbox: "Microsoft Store / Xbox Game Pass",
  nintendo: "Nintendo eShop",
};

export default function ConsoleDealsSection() {
  const [activePlatform, setActivePlatform] = useState("ps5");
  const [dealsCache, setDealsCache] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchConsoleDeals = async (platform) => {
    if (dealsCache[platform]) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the current best ${PLATFORM_STORES[platform]} deals and discounted games available right now in Europe (May 2026). Return the top 12 games on sale with their current prices in EUR. Only include games that are genuinely discounted.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          deals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                price_eur: { type: "string" },
                original_price_eur: { type: "string" },
                discount_percent: { type: "string" },
                genre: { type: "string" },
                store_url: { type: "string" },
                image_url: { type: "string" },
              }
            }
          }
        }
      }
    });
    setDealsCache((prev) => ({ ...prev, [platform]: result?.deals || [] }));
    setLoading(false);
  };

  const handlePlatform = (platform) => {
    setActivePlatform(platform);
    fetchConsoleDeals(platform);
  };

  const refresh = () => {
    setDealsCache((prev) => { const c = { ...prev }; delete c[activePlatform]; return c; });
    fetchConsoleDeals(activePlatform);
  };

  const currentDeals = dealsCache[activePlatform];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => handlePlatform(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono font-semibold tracking-wider transition-all ${
              activePlatform === id
                ? id === "ps5" ? "bg-blue-500/15 border-blue-500/50 text-blue-400" :
                  id === "xbox" ? "bg-green-500/15 border-green-500/50 text-green-400" :
                  "bg-red-500/15 border-red-500/50 text-red-400"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{emoji}</span> {label}
          </button>
        ))}
        {currentDeals && (
          <Button variant="ghost" size="sm" onClick={refresh} className="gap-1.5 text-xs text-muted-foreground font-mono ml-auto">
            <RefreshCw className="h-3.5 w-3.5" /> Aggiorna
          </Button>
        )}
      </div>

      {/* Content */}
      {!currentDeals && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground border border-dashed border-border rounded-xl">
          <Gamepad2 className="h-10 w-10 opacity-30" />
          <p className="text-sm font-mono">Clicca su una piattaforma per caricare le offerte</p>
          <Button onClick={() => fetchConsoleDeals(activePlatform)} className="gap-2">
            <Loader2 className="h-4 w-4" /> Carica offerte
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="font-mono text-xs text-accent tracking-widest animate-pulse uppercase">Ricerca offerte in corso...</span>
        </div>
      )}

      {currentDeals && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentDeals.map((deal, i) => (
            <ConsoleDealCard key={i} deal={deal} platform={activePlatform} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}