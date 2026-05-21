import { ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PLATFORM_COLORS = {
  ps5: { border: "border-blue-500/30", bg: "bg-blue-500/5", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  xbox: { border: "border-green-500/30", bg: "bg-green-500/5", badge: "bg-green-500/20 text-green-400 border-green-500/30" },
  nintendo: { border: "border-red-500/30", bg: "bg-red-500/5", badge: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const PLATFORM_LABELS = { ps5: "PS5", xbox: "Xbox", nintendo: "Nintendo" };

export default function ConsoleDealCard({ deal, platform, index }) {
  const colors = PLATFORM_COLORS[platform] || PLATFORM_COLORS.ps5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-card rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {deal.image_url && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={deal.image_url}
            alt={deal.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{deal.title}</h3>
          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${colors.badge}`}>
            {PLATFORM_LABELS[platform]}
          </span>
        </div>

        {deal.genre && (
          <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border">
            {deal.genre}
          </span>
        )}

        <div className="flex items-end justify-between pt-0.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-accent">€{deal.price_eur}</span>
              {deal.original_price_eur && deal.original_price_eur !== deal.price_eur && (
                <span className="text-xs text-muted-foreground line-through">€{deal.original_price_eur}</span>
              )}
            </div>
            {deal.discount_percent && (
              <span className="text-[10px] font-black text-primary">-{deal.discount_percent}%</span>
            )}
          </div>
          {deal.store_url && (
            <a href={deal.store_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 font-mono text-xs tracking-wider bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 h-8">
                <ExternalLink className="h-3 w-3" /> Acquista
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}