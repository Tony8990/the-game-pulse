import { useState, useEffect } from "react";
import { Heart, Trash2, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadFavorites = async () => {
    setLoading(true);
    const favs = await base44.entities.FavoriteGame.list("-created_date");
    setFavorites(favs);
    setLoading(false);
  };

  useEffect(() => { loadFavorites(); }, []);

  const removeFavorite = async (fav) => {
    await base44.entities.FavoriteGame.delete(fav.id);
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    toast("Rimosso dai preferiti");
  };

  const checkPrices = async () => {
    setChecking(true);
    let alertsCreated = 0;
    for (const fav of favorites) {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(fav.title)}&pageSize=1&sortBy=Price`);
      const data = await res.json();
      if (data.length > 0) {
        const cheapest = data[0];
        const newPrice = parseFloat(cheapest.salePrice);
        const targetPrice = fav.target_price || parseFloat(fav.cheapest_price || "999");
        if (newPrice < targetPrice && cheapest.salePrice !== fav.last_notified_price) {
          await base44.entities.PriceAlert.create({
            game_id: fav.game_id,
            title: fav.title,
            old_price: fav.cheapest_price,
            new_price: cheapest.salePrice,
            store_name: cheapest.storeID,
            deal_url: `https://www.cheapshark.com/redirect?dealID=${cheapest.dealID}`,
            is_read: false,
          });
          await base44.entities.FavoriteGame.update(fav.id, {
            cheapest_price: cheapest.salePrice,
            last_notified_price: cheapest.salePrice,
          });
          alertsCreated++;
        }
      }
    }
    setChecking(false);
    if (alertsCreated > 0) {
      toast.success(`${alertsCreated} nuove offerte trovate! Controlla le notifiche.`);
    } else {
      toast("Nessuna nuova offerta sotto il prezzo target.");
    }
    loadFavorites();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400 fill-red-400" />
            Preferiti
          </h1>
          <p className="text-muted-foreground mt-1">{favorites.length} giochi salvati</p>
        </div>
        {favorites.length > 0 && (
          <Button onClick={checkPrices} disabled={checking} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            Controlla prezzi
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-2">
          <Heart className="h-12 w-12 mx-auto opacity-30" />
          <p>Nessun gioco nei preferiti.</p>
          <p className="text-sm">Aggiungi giochi dalla pagina delle offerte!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {favorites.map((fav) => (
              <motion.div
                key={fav.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <img
                  src={fav.thumb}
                  alt={fav.title}
                  className="h-16 w-24 object-cover rounded-lg bg-secondary"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=100&q=80"; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{fav.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-accent font-bold">${fav.cheapest_price || "N/A"}</span>
                    {fav.normal_price && fav.normal_price !== fav.cheapest_price && (
                      <span className="text-xs text-muted-foreground line-through">${fav.normal_price}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Notifica sotto ${fav.target_price?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFavorite(fav)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}