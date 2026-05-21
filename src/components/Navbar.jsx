import { Link, useLocation } from "react-router-dom";
import { Gamepad2, Heart, Bell, Search, LogOut, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

export default function Navbar() {
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const loadAlerts = async () => {
      const alerts = await base44.entities.PriceAlert.filter({ is_read: false });
      setAlertCount(alerts.length);
    };
    loadAlerts();
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-background/85 backdrop-blur-xl"
      style={{ boxShadow: "0 1px 0 0 hsl(285 100% 60% / 0.2), 0 4px 30px hsl(285 100% 60% / 0.05)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg border border-primary/40 bg-primary/10 flex items-center justify-center group-hover:border-primary/70 transition-all"
            style={{ boxShadow: "0 0 12px hsl(285 100% 60% / 0.3)" }}>
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-lg font-black tracking-widest text-foreground">
              GAME<span className="text-primary neon-text">DEALS</span>
            </span>
            <div className="text-[9px] text-accent tracking-[0.3em] font-mono -mt-1 uppercase opacity-70">Cyberpunk Edition</div>
          </div>
        </Link>

        <div className="flex items-center gap-0.5">
          {[
            { to: "/", icon: Search, label: "Offerte" },
            { to: "/news", icon: Newspaper, label: "News" },
            { to: "/favorites", icon: Heart, label: "Preferiti" },
            { to: "/alerts", icon: Bell, label: "Notifiche", badge: alertCount },
          ].map(({ to, icon: Icon, label, badge }) => (
            <Link to={to} key={to}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 relative font-mono text-xs tracking-wider ${
                  isActive(to)
                    ? "text-accent border border-accent/30 bg-accent/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-black flex items-center justify-center text-primary-foreground neon-text">
                    {badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => base44.auth.logout()}
            className="text-muted-foreground ml-1 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}