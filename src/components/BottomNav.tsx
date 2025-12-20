import { useLocation, useNavigate } from "react-router-dom";
import { Home, History, FlaskConical, User, Star, Ticket, Navigation, Train } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useApp();

  // Don't show on auth page
  if (location.pathname === "/auth" || location.pathname === "/") {
    return null;
  }

  const NAV_ITEMS = [
    { icon: Home, label: t("home"), path: "/dashboard" },
    { icon: Ticket, label: t("pnrStatus"), path: "/pnr-status" },
    { icon: Navigation, label: "Live", path: "/live-train" },
    { icon: Train, label: "Trains", path: "/trains-between" },
    { icon: User, label: t("profile"), path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom z-40">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-1", isActive && "animate-bounce-gentle")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
