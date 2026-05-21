import { Heart, ExternalLink, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const STORE_MAP = {
  "1": "Steam", "2": "GamersGate", "3": "GreenManGaming", "7": "GOG",
  "8": "Origin", "11": "Humble", "13": "Uplay", "15": "Fanatical",
  "21": "WinGameStore", "25": "Epic Games", "27": "Gamesplanet",
  "30": "IndieGala", "31": "Blizzard"
};

export default function DealCard({ deal, isFavorite, onToggleFavorite, eurRate = 0.92 }) {
  const navigate = useNavigate();
  const savings = Math.round(parseFloat(deal.savings || 0));
  const storeName = STORE_MAP[deal.storeID] || `Store ${deal.storeID}`;
  const metacritic = deal.metacriticScore ? parseInt(deal.metacriticScore) : 0;
  const eurPrice = (parseFloat(deal.salePrice) * eurRate).toFixed(2);
  const eurNormal = (parseFloat(deal.normalPrice) * eurRate).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-card rounded-lg border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50"
      style={{ transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 1px hsl(285 100% 60% / 0.4), 0 0 25px hsl(285 100% 60% / 0.12), 0 -2px 0 0'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
      onClick={() => navigate(`/game/${deal.gameID}`)}
    >
      {savings > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded text-xs font-black bg-primary text-primary-foreground neon-text" style={{fontSize: 11}}>
          -{savings}%
        </div>
      )}

      <div className="aspect-[16/9] bg-secondary overflow-hidden relative">
        <img
          src={deal.thumb}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3.5 space-y-2.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {deal.title}
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground border border-border">{storeName}</span>
          {metacritic > 0 && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
              metacritic >= 75 ? "bg-green-500/10 text-green-400 border-green-500/30" :
              metacritic >= 50 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
              "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>
              <Star className="h-2.5 w-2.5" />{metacritic}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between pt-0.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-accent neon-text">€{eurPrice}</span>
              <span className="text-xs text-muted-foreground">${deal.salePrice}</span>
            </div>
            {deal.normalPrice !== deal.salePrice && (
              <div className="text-xs text-muted-foreground line-through">€{eurNormal}</div>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isFavorite ? "text-red-400 hover:text-red-300" : "text-muted-foreground"}`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(deal); }}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <a
              href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}