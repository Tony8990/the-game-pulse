import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Loader2, Flame, TrendingDown, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import DealCard from "../components/DealCard";
import { toast } from "sonner";
import _ from "lodash";

const SORT_OPTIONS = [
  { value: "Deal Rating", label: "Migliori offerte", icon: Flame },
  { value: "Price", label: "Prezzo più basso", icon: TrendingDown },
  { value: "Metacritic", label: "Voto Metacritic", icon: Star },
  { value: "Recent", label: "Più recenti" },
  { value: "Savings", label: "Maggiore sconto" },
];

const PAGE_SIZE = 60;

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Deal Rating");
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(0);
  const [eurRate, setEurRate] = useState(0.92);
  const [totalPages, setTotalPages] = useState(1);

  const loadFavorites = async () => {
    const favs = await base44.entities.FavoriteGame.list();
    setFavorites(favs);
  };

  const fetchDeals = async (searchTerm = "", sort = sortBy, pageNum = 0) => {
    setLoading(true);
    if (searchTerm && searchTerm.trim().length > 1) {
      const gamesRes = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(searchTerm)}&limit=60`);
      const games = await gamesRes.json();
      const dealsWithGame = games.map((g) => ({
        dealID: g.cheapestDealID,
        gameID: g.gameID,
        title: g.external,
        thumb: g.thumb,
        salePrice: g.cheapest,
        normalPrice: g.cheapest,
        savings: "0",
        storeID: "1",
        metacriticScore: "",
      }));
      setDeals(dealsWithGame);
      setTotalPages(Math.ceil(dealsWithGame.length / PAGE_SIZE) || 1);
    } else {
      const res = await fetch(
        `https://www.cheapshark.com/api/1.0/deals?sortBy=${sort}&pageSize=${PAGE_SIZE}&pageNumber=${pageNum}&onSale=1`
      );
      const total = res.headers.get("X-Total-Page-Count");
      if (total) setTotalPages(parseInt(total));
      const data = await res.json();
      const seen = new Set();
      const unique = data.filter((d) => {
        if (seen.has(d.gameID)) return false;
        seen.add(d.gameID);
        return true;
      });
      setDeals(unique);
    }
    setLoading(false);
  };

  const debouncedSearch = useCallback(
    _.debounce((term) => {
      setPage(0);
      fetchDeals(term, sortBy, 0);
    }, 500),
    [sortBy]
  );

  useEffect(() => {
    fetchDeals();
    loadFavorites();
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => { if (d?.rates?.EUR) setEurRate(d.rates.EUR); })
      .catch(() => {});
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setPage(0);
    fetchDeals(search, val, 0);
  };

  const goToPage = (p) => {
    if (p < 0 || p >= totalPages) return;
    setPage(p);
    fetchDeals(search, sortBy, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = async (deal) => {
    const gameId = deal.gameID || deal.dealID;
    const existing = favorites.find((f) => f.game_id === gameId);
    if (existing) {
      await base44.entities.FavoriteGame.delete(existing.id);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      toast("Rimosso dai preferiti");
    } else {
      const fav = await base44.entities.FavoriteGame.create({
        game_id: gameId,
        title: deal.title,
        thumb: deal.thumb,
        cheapest_price: deal.salePrice,
        normal_price: deal.normalPrice,
        target_price: parseFloat(deal.salePrice),
      });
      setFavorites((prev) => [...prev, fav]);
      toast.success("Aggiunto ai preferiti!");
    }
  };

  const favGameIds = new Set(favorites.map((f) => f.game_id));

  const getPageNumbers = () => {
    const range = [];
    const delta = 2;
    for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative space-y-1 pb-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-primary rounded" style={{ boxShadow: "0 0 8px hsl(285 100% 60%)" }} />
          <span className="font-mono text-[10px] text-primary tracking-[0.4em] uppercase opacity-70">// SYS.INIT</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-widest uppercase retro-title">
          DEAL<span className="text-primary neon-text">_</span>SCAN
        </h1>
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          &gt; migliori prezzi pc — aggiornati in tempo reale_
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          <Input
            placeholder="SEARCH_GAME..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10 bg-card border-primary/20 font-mono text-sm focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </div>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-56 bg-card border-primary/20 font-mono text-xs">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-primary/60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-mono text-xs">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 animate-ping opacity-20"><Loader2 className="h-10 w-10 text-primary" /></div>
          </div>
          <span className="font-mono text-xs text-accent tracking-[0.4em] uppercase animate-pulse">&gt; loading data...</span>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-24 space-y-2">
          <p className="font-mono text-muted-foreground text-sm">NO_RESULTS_FOUND</p>
          <p className="font-mono text-xs text-muted-foreground/50">try another search query_</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            <span>&gt; {deals.length} risultati trovati</span>
            <span>PAG. {page + 1}/{totalPages || "?"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deals.map((deal, i) => (
              <DealCard
                key={deal.dealID || i}
                deal={deal}
                isFavorite={favGameIds.has(deal.gameID || deal.dealID)}
                onToggleFavorite={toggleFavorite}
                eurRate={eurRate}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 pt-6 pb-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(0)}
              disabled={page === 0}
              className="h-8 w-8 font-mono border-primary/20 hover:border-primary/60 hover:text-primary text-xs"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="h-8 w-8 border-primary/20 hover:border-primary/60 hover:text-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {page > 2 && <span className="text-muted-foreground/40 font-mono text-xs px-1">...</span>}

            {getPageNumbers().map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                onClick={() => goToPage(p)}
                className={`h-8 w-8 font-mono text-xs ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary/20 hover:border-primary/60 hover:text-primary"
                }`}
              >
                {p + 1}
              </Button>
            ))}

            {page < totalPages - 3 && <span className="text-muted-foreground/40 font-mono text-xs px-1">...</span>}

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(page + 1)}
              disabled={deals.length < 20}
              className="h-8 w-8 border-primary/20 hover:border-primary/60 hover:text-primary"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 font-mono border-primary/20 hover:border-primary/60 hover:text-primary text-xs"
            >
              »
            </Button>
          </div>
        </>
      )}
    </div>
  );
}