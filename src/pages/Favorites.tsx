import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Star, Trash2, Play, Train, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Favorite {
  id: string;
  train_no: string;
  source: string;
  destination: string;
  class_type: string;
  quota: string;
  nickname: string | null;
  created_at: string;
}

export default function Favorites() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFavorites(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchFavorites = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast({ title: "Failed to load favorites", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setFavorites(favorites.filter((f) => f.id !== id));
      toast({ title: "Favorite removed" });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const runFavorite = (fav: Favorite) => {
    navigate("/dashboard", {
      state: {
        trainNo: fav.train_no,
        source: fav.source,
        destination: fav.destination,
        classType: fav.class_type,
        quota: fav.quota,
      },
    });
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="My Favorites" subtitle="Quick access to saved routes">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="px-4 -mt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading favorites..." />
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-card p-8 text-center animate-scale-in">
            <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Save your frequent routes for quick access!
            </p>
            <Button variant="gradient" onClick={() => navigate("/dashboard")}>
              Search Trains
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav, index) => (
              <div
                key={fav.id}
                className="glass-card p-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-warning fill-warning" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {fav.nickname || `Train ${fav.train_no}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fav.train_no} • {fav.class_type} • {fav.quota}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm mb-4">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{fav.source}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-foreground">{fav.destination}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="flex-1"
                    onClick={() => runFavorite(fav)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run Search
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFavorite(fav.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
