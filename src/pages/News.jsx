import { useState, useEffect } from "react";
import { Newspaper, RefreshCw, ExternalLink, Loader2, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "PC games", label: "PC" },
  { id: "PlayStation PS5", label: "PS5" },
  { id: "Xbox", label: "Xbox" },
  { id: "Nintendo Switch", label: "Nintendo" },
  { id: "new game releases", label: "Releases" },
  { id: "game deals discounts", label: "Deals" },
  { id: "gaming hardware GPU", label: "Hardware" },
  { id: "esports tournaments", label: "Esports" },
  { id: "indie games", label: "Indie" },
  { id: "game updates patches", label: "Updates" },
  { id: "RPG games", label: "RPG" },
  { id: "FPS shooter games", label: "FPS" },
];

const PER_PAGE = 9;

export default function News() {
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);

  const fetchNews = async (cat = "all") => {
    setLoading(true);
    setPage(0);
    const topic = cat === "all" ? "gaming" : `gaming ${cat}`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the latest ${topic} news from May 2026. Include major announcements, new releases, updates, deals, industry news, reviews and developer news. Return at least 36 distinct recent articles with full details. For each article, provide a high-quality image URL: prefer the official Steam store header image (format: https://cdn.akamai.steamstatic.com/steam/apps/APPID/header.jpg), or an image from the game's official site, IGN, Eurogamer, or Kotaku. The image should be directly related to the game or topic of the article. Always include a working image_url.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                source: { type: "string" },
                url: { type: "string" },
                published_at: { type: "string" },
                category: { type: "string" },
                image_url: { type: "string" },
              }
            }
          }
        }
      }
    });
    setAllNews(result?.articles || []);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const handleCategory = (cat) => {
    setCategory(cat);
    fetchNews(cat);
  };

  const totalPages = Math.ceil(allNews.length / PER_PAGE);
  const pagedNews = allNews.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const getPageNumbers = () => {
    const range = [];
    for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative space-y-1 pb-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-accent rounded" style={{ boxShadow: "0 0 8px hsl(185 100% 50%)" }} />
          <span className="font-mono text-[10px] text-accent tracking-[0.4em] uppercase opacity-70">// LIVE.FEED</span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-red-400 animate-pulse">
            <Radio className="h-2.5 w-2.5" /> LIVE
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-widest uppercase">
            NEWS<span className="text-accent neon-text">_</span>FEED
          </h1>
          <Button
            variant="outline"
            onClick={() => fetchNews(category)}
            disabled={loading}
            className="gap-2 font-mono text-xs border-accent/30 hover:border-accent text-accent hover:text-accent"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </Button>
        </div>
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          &gt; ultime notizie dal mondo del gaming_
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleCategory(id)}
            className={`px-4 py-1.5 font-mono text-xs font-bold tracking-[0.2em] uppercase border transition-all duration-200 rounded ${
              category === id
                ? "bg-accent/15 border-accent/60 text-accent"
                : "bg-card border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {id === category && <span className="mr-1 text-accent">&gt;</span>}{label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <div className="absolute inset-0 animate-ping opacity-20"><Loader2 className="h-10 w-10 text-accent" /></div>
          </div>
          <div className="font-mono text-xs text-accent tracking-[0.4em] uppercase animate-pulse">&gt; fetching news feed...</div>
        </div>
      )}

      {/* Articles grid */}
      {!loading && pagedNews.length > 0 && (
        <>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            <span>&gt; {allNews.length} articoli caricati</span>
            <span>PAG. {page + 1}/{totalPages}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedNews.map((article, i) => (
              <motion.article
                key={`${page}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-accent/40 cursor-pointer relative"
                style={{ cursor: article.url ? "pointer" : "default" }}
                onClick={() => article.url && window.open(article.url, "_blank")}
              >
                {/* Scanline overlay on hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 scanline-overlay z-10" />

                <div className="aspect-video overflow-hidden bg-secondary relative">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 group-hover:brightness-75"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border"
                    style={{ display: article.image_url ? "none" : "flex" }}
                  >
                    <Newspaper className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 justify-between">
                    {article.category && (
                      <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold border border-accent/20 uppercase tracking-[0.15em] font-mono">
                        {article.category}
                      </span>
                    )}
                    {article.published_at && (
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">{article.published_at}</span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm leading-snug group-hover:text-accent transition-colors duration-200">
                    {article.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{article.summary}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground font-mono opacity-50">{article.source || "—"}</span>
                    {article.url && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                        <span className="text-[10px] font-mono">READ</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
              <Button
                variant="outline" size="icon"
                onClick={() => setPage(0)} disabled={page === 0}
                className="h-8 w-8 font-mono border-accent/20 hover:border-accent hover:text-accent text-xs"
              >«</Button>
              <Button
                variant="outline" size="icon"
                onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="h-8 w-8 border-accent/20 hover:border-accent hover:text-accent"
              ><ChevronLeft className="h-3.5 w-3.5" /></Button>

              {page > 2 && <span className="text-muted-foreground/40 font-mono text-xs px-1">...</span>}
              {getPageNumbers().map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 font-mono text-xs ${
                    p === page
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-accent/20 hover:border-accent hover:text-accent"
                  }`}
                >{p + 1}</Button>
              ))}
              {page < totalPages - 3 && <span className="text-muted-foreground/40 font-mono text-xs px-1">...</span>}

              <Button
                variant="outline" size="icon"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="h-8 w-8 border-accent/20 hover:border-accent hover:text-accent"
              ><ChevronRight className="h-3.5 w-3.5" /></Button>
              <Button
                variant="outline" size="icon"
                onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                className="h-8 w-8 font-mono border-accent/20 hover:border-accent hover:text-accent text-xs"
              >»</Button>
            </div>
          )}
        </>
      )}

      {!loading && allNews.length === 0 && (
        <div className="text-center py-24 space-y-3">
          <Newspaper className="h-12 w-12 mx-auto opacity-20" />
          <p className="font-mono text-muted-foreground text-sm">NO_ARTICLES_FOUND</p>
          <p className="font-mono text-xs text-muted-foreground/40">try refreshing_</p>
        </div>
      )}
    </div>
  );
}