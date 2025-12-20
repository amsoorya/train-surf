import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Train, MapPin, Clock, Navigation, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface StationStatus {
  stationName: string;
  stationCode: string;
  arrivalTime: string;
  departureTime: string;
  delay: string;
  distance: string;
  isPassed: boolean;
  isCurrent: boolean;
}

interface LiveTrainData {
  trainNo?: string;
  trainName?: string;
  currentStation?: string;
  lastUpdated?: string;
  delay?: string;
  stations?: StationStatus[];
  error?: string;
}

export default function LiveTrainStatus() {
  const navigate = useNavigate();
  const [trainNo, setTrainNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LiveTrainData | null>(null);

  const handleSearch = async () => {
    if (!trainNo) {
      toast({ title: "Enter train number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("live-train", {
        body: { trainNo }
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      setData(result);
    } catch (err) {
      console.error("Live train error:", err);
      toast({ title: "Failed to fetch live status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Live Train Status" subtitle="Track train in real-time">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="flex-1 px-4 -mt-4 pb-20">
        {/* Search Card */}
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <div className="space-y-4">
            <div>
              <Label htmlFor="trainNo">Train Number</Label>
              <div className="relative mt-1">
                <Train className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="trainNo"
                  type="text"
                  placeholder="e.g., 12814"
                  value={trainNo}
                  onChange={(e) => setTrainNo(e.target.value.replace(/\D/g, ""))}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              variant="gradient" 
              className="w-full" 
              onClick={handleSearch}
              disabled={loading || !trainNo}
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4 mr-2" /> Track Train</>}
            </Button>
          </div>
        </div>

        {/* Results */}
        {data && !data.error && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{data.trainNo} - {data.trainName}</h3>
                <p className="text-sm text-muted-foreground">
                  {data.currentStation && <>At {data.currentStation}</>}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSearch}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Delay Info */}
            {data.delay && (
              <div className={`p-3 rounded-lg mb-4 ${data.delay === "On Time" ? "bg-success/10" : "bg-warning/10"}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${data.delay === "On Time" ? "text-success" : "text-warning"}`} />
                  <span className={`font-medium ${data.delay === "On Time" ? "text-success" : "text-warning"}`}>
                    {data.delay}
                  </span>
                </div>
              </div>
            )}

            {/* Station Timeline */}
            {data.stations && data.stations.length > 0 && (
              <div className="space-y-0">
                <h4 className="font-semibold text-foreground mb-4">Route Progress</h4>
                {data.stations.map((station, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        station.isCurrent ? "bg-primary animate-pulse" :
                        station.isPassed ? "bg-success" : "bg-muted"
                      }`} />
                      {i < data.stations!.length - 1 && (
                        <div className={`w-0.5 h-12 ${station.isPassed ? "bg-success" : "bg-muted"}`} />
                      )}
                    </div>
                    
                    {/* Station info */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${station.isCurrent ? "text-primary" : "text-foreground"}`}>
                            {station.stationName}
                          </p>
                          <p className="text-xs text-muted-foreground">{station.stationCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{station.arrivalTime}</p>
                          <p className="text-xs text-muted-foreground">{station.distance}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Last Updated */}
            {data.lastUpdated && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Last updated: {data.lastUpdated}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
