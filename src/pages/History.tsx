import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HistoryEntry, Segment } from "@/types/trainsurf";
import { ArrowLeft, Trash2, RefreshCw, Train, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { User } from "@supabase/supabase-js";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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
        fetchHistory(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchHistory = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: HistoryEntry[] = (data || []).map((item) => ({
        id: item.id,
        trainNo: item.train_no,
        source: item.source,
        destination: item.destination,
        date: item.journey_date,
        classType: item.class_type,
        quota: item.quota,
        seatChanges: item.seat_changes || 0,
        success: item.success,
        timestamp: item.created_at,
        segments: (item.segments as unknown as Segment[]) || undefined,
      }));

      setHistory(formatted);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({ title: "Failed to load history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory(history.filter((h) => h.id !== id));
      toast({ title: "Entry deleted" });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const rerunSearch = (entry: HistoryEntry) => {
    navigate("/dashboard", {
      state: {
        trainNo: entry.trainNo,
        source: entry.source,
        destination: entry.destination,
        date: entry.date,
        classType: entry.classType,
        quota: entry.quota,
      },
    });
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="Search History" subtitle="Your previous TrainSurf searches">
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
            <LoadingSpinner text="Loading history..." />
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Train className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No searches yet</h3>
            <p className="text-muted-foreground mb-4">
              Your TrainSurf search history will appear here.
            </p>
            <Button variant="gradient" onClick={() => navigate("/dashboard")}>
              Start Searching
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="glass-card p-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Train className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{entry.trainNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.classType} • {entry.quota}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      entry.success
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {entry.success ? `${entry.seatChanges} changes` : "No path"}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{entry.source}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-foreground">{entry.destination}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(entry.date), "dd MMM yyyy")} •{" "}
                    {format(new Date(entry.timestamp), "dd MMM, HH:mm")}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => rerunSearch(entry)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Re-run
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
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
