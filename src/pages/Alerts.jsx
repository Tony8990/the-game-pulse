import { useState, useEffect } from "react";
import { Bell, ExternalLink, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.PriceAlert.list("-created_date");
      setAlerts(data);
      setLoading(false);
    };
    load();
  }, []);

  const markRead = async (alert) => {
    await base44.entities.PriceAlert.update(alert.id, { is_read: true });
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    for (const a of unread) {
      await base44.entities.PriceAlert.update(a.id, { is_read: true });
    }
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    toast.success("Tutte le notifiche segnate come lette");
  };

  const deleteAlert = async (alert) => {
    await base44.entities.PriceAlert.delete(alert.id);
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notifiche
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} non lette` : "Tutto letto!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="gap-2">
            <Check className="h-4 w-4" />
            Segna tutte come lette
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-2">
          <Bell className="h-12 w-12 mx-auto opacity-30" />
          <p>Nessuna notifica.</p>
          <p className="text-sm">Aggiungi giochi ai preferiti e controlla i prezzi!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                  alert.is_read
                    ? "bg-card border-border opacity-60"
                    : "bg-card border-primary/30 shadow-sm shadow-primary/5"
                }`}
              >
                {!alert.is_read && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{alert.title}</h3>
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground line-through">${alert.old_price}</span>
                    {" → "}
                    <span className="text-accent font-bold">${alert.new_price}</span>
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!alert.is_read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(alert)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {alert.deal_url && (
                    <a href={alert.deal_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAlert(alert)}>
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