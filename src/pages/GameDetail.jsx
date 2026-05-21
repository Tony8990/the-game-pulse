import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star, Tag, ShoppingCart, Loader2, TrendingDown, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine, Legend
} from "recharts";

const STORE_MAP = {
  "1": "Steam", "2": "GamersGate", "3": "GreenManGaming", "7": "GOG",
  "8": "Origin", "11": "Humble Store", "13": "Uplay", "15": "Fanatical",
  "21": "WinGameStore", "25": "Epic Games", "27": "Gamesplanet",
  "30": "IndieGala", "31": "Blizzard"
};

const STORE_COLORS = {
  "1": "#1b9bed", "7": "#b13dc5", "11": "#e8720c", "25": "#0078f2",
  "15": "#e84393", "3": "#00b860"
};

export default function GameDetail() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [eurRate, setEurRate] = useState(0.92);

  const toEur = (usd) => (parseFloat(usd || 0) * eurRate).toFixed(2);

  useEffect(() => {
    const load = async () => {
      // EUR rate
      const rateRes = await fetch("https://open.er-api.com/v6/latest/USD").catch(() => null);
      if (rateRes?.ok) {
        const rateData = await rateRes.json();
        if (rateData?.rates?.EUR) setEurRate(rateData.rates.EUR);
      }

      // Game data
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameId}`);
      const data = await res.json();
      setGameData(data);
      setLoading(false);

      // AI: description + trailer + genre
      if (data?.info?.title) {
        setAiLoading(true);
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `For the PC game "${data.info.title}", provide:
1. A compelling description in Italian (3-4 sentences) about gameplay and story
2. Genre tags (max 3, in Italian)
3. Developer name
4. Release year
5. The exact YouTube video ID (just the ID like "dQw4w9WgXcQ") of the official game trailer or gameplay trailer. Search for "${data.info.title} official trailer" on YouTube and return the video ID.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              genres: { type: "array", items: { type: "string" } },
              developer: { type: "string" },
              release_year: { type: "string" },
              youtube_video_id: { type: "string" }
            }
          }
        });
        setAiData(result);
        setAiLoading(false);
      }
    };
    load();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <span className="font-mono text-xs text-accent tracking-widest uppercase animate-pulse">Caricamento dati...</span>
      </div>
    );
  }

  if (!gameData) return <div className="text-center py-20 text-muted-foreground">Gioco non trovato.</div>;

  const { info, deals, cheapestPriceEver } = gameData;
  const title = info?.title || "Titolo sconosciuto";
  const thumb = info?.thumb;
  const metacritic = info?.metacriticScore ? parseInt(info.metacriticScore) : 0;
  const steamRating = info?.steamRatingText;
  const steamPercent = info?.steamRatingPercent;

  const sortedDeals = [...(deals || [])].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  const bestDeal = sortedDeals[0];
  const savings = bestDeal && bestDeal.retailPrice && bestDeal.price !== bestDeal.retailPrice
    ? Math.round(((parseFloat(bestDeal.retailPrice) - parseFloat(bestDeal.price)) / parseFloat(bestDeal.retailPrice)) * 100)
    : 0;

  // Chart data: current prices per store
  const chartData = sortedDeals.map((d) => ({
    store: STORE_MAP[d.storeID] || `Store ${d.storeID}`,
    sale: parseFloat(d.price),
    retail: parseFloat(d.retailPrice),
    storeID: d.storeID,
  }));

  // Simulate price history using available data points
  const priceHistory = (() => {
    const min = parseFloat(cheapestPriceEver?.price || bestDeal?.price || 0);
    const retail = parseFloat(bestDeal?.retailPrice || bestDeal?.price || 0);
    const current = parseFloat(bestDeal?.price || 0);
    const mid = ((retail + current) / 2).toFixed(2);
    return [
      { month: "12 mesi fa", price: retail },
      { month: "9 mesi fa", price: parseFloat((retail * 0.85).toFixed(2)) },
      { month: "6 mesi fa", price: parseFloat(mid) },
      { month: "3 mesi fa", price: parseFloat((current * 1.3).toFixed(2)) },
      { month: "1 mese fa", price: parseFloat((current * 1.1).toFixed(2)) },
      { month: "Oggi", price: current },
    ];
  })();

  return (
    <div className="space-y-8 pb-16">
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2 font-mono text-xs text-muted-foreground hover:text-accent tracking-wider">
        <ArrowLeft className="h-4 w-4" /> TORNA ALLE OFFERTE
      </Button>

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden border border-primary/20 neon-border">
        <div className="absolute inset-0">
          <img src={thumb} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-6 p-6">
          <img
            src={thumb}
            alt={title}
            className="w-full sm:w-56 h-36 object-cover rounded-lg border border-primary/30"
            style={{ boxShadow: "0 0 20px hsl(285 100% 60% / 0.3)" }}
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80"; }}
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3 flex-wrap">
              {savings > 0 && (
                <span className="px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/40 text-sm font-black neon-text">-{savings}%</span>
              )}
              <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">{title}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {metacritic > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  metacritic >= 75 ? "bg-green-500/10 text-green-400 border-green-500/30" :
                  metacritic >= 50 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                  "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  <Star className="h-3 w-3" /> Metacritic {metacritic}
                </div>
              )}
              {steamPercent && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 text-xs text-muted-foreground border border-border">
                  Steam: {steamRating} ({steamPercent}%)
                </div>
              )}
              {aiData?.genres?.map((g) => (
                <span key={g} className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs border border-accent/20">{g}</span>
              ))}
              {aiData?.developer && (
                <span className="px-3 py-1.5 rounded-lg bg-secondary/80 text-xs text-muted-foreground border border-border">{aiData.developer}</span>
              )}
              {aiData?.release_year && (
                <span className="px-3 py-1.5 rounded-lg bg-secondary/80 text-xs text-muted-foreground border border-border">{aiData.release_year}</span>
              )}
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Loader2 className="h-3 w-3 animate-spin" /> Caricamento descrizione AI...
              </div>
            ) : aiData?.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{aiData.description}</p>
            ) : null}

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-accent neon-text">€{toEur(bestDeal?.price)}</span>
              <span className="text-lg text-muted-foreground font-mono">${bestDeal?.price}</span>
              {bestDeal?.retailPrice !== bestDeal?.price && (
                <span className="text-base text-muted-foreground line-through">€{toEur(bestDeal?.retailPrice)}</span>
              )}
            </div>
            {cheapestPriceEver?.price && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <TrendingDown className="h-3.5 w-3.5 text-accent" />
                MINIMO STORICO: <strong className="text-accent">€{toEur(cheapestPriceEver.price)} (${cheapestPriceEver.price})</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Video */}
      {(aiLoading || aiData?.youtube_video_id) && (
        <div className="space-y-3">
          <h2 className="font-display font-black text-lg tracking-widest uppercase flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            <span>Trailer</span>
            <span className="text-primary neon-text">/ Video</span>
          </h2>
          {aiLoading ? (
            <div className="aspect-video rounded-xl bg-card border border-border flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="font-mono text-xs tracking-wider">Ricerca trailer...</span>
              </div>
            </div>
          ) : aiData?.youtube_video_id ? (
            <div className="aspect-video rounded-xl overflow-hidden border border-primary/20 neon-border">
              <iframe
                src={`https://www.youtube.com/embed/${aiData.youtube_video_id}?autoplay=0&rel=0`}
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Price History Chart */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 neon-border">
        <h2 className="font-display font-black text-lg tracking-widest uppercase flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-accent" />
          <span>Andamento</span>
          <span className="text-accent neon-text">Prezzi</span>
          <span className="text-xs font-normal text-muted-foreground font-mono ml-2">(stima)</span>
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 30% 20%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220 15% 50%)", fontSize: 10 }} />
            <YAxis tick={{ fill: "hsl(220 15% 50%)", fontSize: 10 }} tickFormatter={(v) => `€${(v * eurRate).toFixed(0)}`} />
            <Tooltip
              formatter={(val) => [`€${(val * eurRate).toFixed(2)} ($${val})`, "Prezzo"]}
              contentStyle={{ background: "hsl(230 22% 8%)", border: "1px solid hsl(260 30% 20%)", borderRadius: 8, color: "hsl(195 100% 92%)" }}
            />
            {cheapestPriceEver?.price && (
              <ReferenceLine y={parseFloat(cheapestPriceEver.price)} stroke="hsl(185 100% 50%)" strokeDasharray="4 4" label={{ value: "Min", fill: "hsl(185 100% 50%)", fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="price" stroke="hsl(285 100% 60%)" strokeWidth={2.5} dot={{ fill: "hsl(285 100% 60%)", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Store Comparison Bar Chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-display font-black text-lg tracking-widest uppercase flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Confronto</span>
            <span className="text-primary neon-text">Store</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 30% 20%)" />
              <XAxis dataKey="store" tick={{ fill: "hsl(220 15% 50%)", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: "hsl(220 15% 50%)", fontSize: 10 }} tickFormatter={(v) => `€${(v * eurRate).toFixed(0)}`} />
              <Tooltip
                formatter={(val, name) => [`€${(val * eurRate).toFixed(2)} ($${val})`, name === "sale" ? "Prezzo scontato" : "Prezzo pieno"]}
                contentStyle={{ background: "hsl(230 22% 8%)", border: "1px solid hsl(260 30% 20%)", borderRadius: 8, color: "hsl(195 100% 92%)" }}
              />
              <Bar dataKey="retail" name="retail" fill="hsl(230 18% 20%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sale" name="sale" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? "hsl(185 100% 50%)" : STORE_COLORS[entry.storeID] || "hsl(285 100% 60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All Store Prices */}
      <div className="space-y-3">
        <h2 className="font-display font-black text-lg tracking-widest uppercase flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <span>Tutti i</span>
          <span className="text-accent neon-text">Prezzi</span>
        </h2>
        {sortedDeals.map((deal, i) => {
          const storeName = STORE_MAP[deal.storeID] || `Store ${deal.storeID}`;
          const savingsPct = deal.retailPrice && deal.price !== deal.retailPrice
            ? Math.round(((parseFloat(deal.retailPrice) - parseFloat(deal.price)) / parseFloat(deal.retailPrice)) * 100)
            : 0;
          const storeColor = STORE_COLORS[deal.storeID] || "hsl(285 100% 60%)";
          return (
            <div
              key={deal.dealID}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                i === 0
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
              style={i === 0 ? { boxShadow: "0 0 20px hsl(185 100% 50% / 0.1)" } : {}}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{storeName}</span>
                  {i === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black border border-accent/30 tracking-wider">
                      MIGLIOR PREZZO
                    </span>
                  )}
                </div>
                {deal.retailPrice !== deal.price && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Prezzo pieno: <span className="line-through">€{toEur(deal.retailPrice)}</span>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-black text-xl" style={{ color: i === 0 ? "hsl(185 100% 50%)" : storeColor }}>
                  €{toEur(deal.price)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">${deal.price}</div>
              </div>

              {savingsPct > 0 && (
                <div className="px-2 py-1 rounded bg-primary/15 text-primary text-xs font-black border border-primary/30 shrink-0">
                  -{savingsPct}%
                </div>
              )}

              <a
                href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button
                  size="sm"
                  className={`gap-1.5 font-mono text-xs tracking-wider ${
                    i === 0
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40"
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> COMPRA
                </Button>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}