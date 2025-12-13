import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, MapPin, Clock, Train, Search, AlertCircle, CheckCircle } from "lucide-react";

interface StationStatus {
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  actualArrival: string;
  scheduledDeparture: string;
  actualDeparture: string;
  delayInMins: number;
  status: string;
  platform: string | null;
}

interface LiveStatusResult {
  trainNo: string;
  trainName: string;
  runningStatus: string;
  currentStation: string;
  lastUpdated: string;
  route: StationStatus[];
}

export default function LiveStatus() {
  const navigate = useNavigate();
  const [trainNo, setTrainNo] = useState("");
  const [startDay, setStartDay] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveStatusResult | null>(null);

  const fetchLiveStatus = async () => {
    if (!trainNo) {
      toast({ title: "Please enter train number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("live-status", {
        body: { trainNo, startDay: parseInt(startDay) }
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data.error) {
        toast({ title: response.data.error, variant: "destructive" });
        return;
      }

      setResult(response.data);
    } catch (error) {
      console.error("Live status error:", error);
      toast({
        title: "Failed to fetch status",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return "text-success";
    if (delay <= 15) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="Live Train Status" subtitle="Real-time tracking">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="px-4 -mt-4 space-y-4">
        {/* Search Form */}
        <div className="glass-card p-5 space-y-4 animate-scale-in">
          <div>
            <Label htmlFor="trainNo">Train Number</Label>
            <Input
              id="trainNo"
              placeholder="e.g., 22960"
              value={trainNo}
              onChange={(e) => setTrainNo(e.target.value)}
            />
          </div>

          <div>
            <Label>Journey Start Day</Label>
            <Select value={startDay} onValueChange={setStartDay}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Today</SelectItem>
                <SelectItem value="1">Yesterday</SelectItem>
                <SelectItem value="2">2 Days Ago</SelectItem>
                <SelectItem value="3">3 Days Ago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="gradient"
            className="w-full"
            onClick={fetchLiveStatus}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Get Live Status
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-slide-up">
            {/* Train Info */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Train className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{result.trainNo}</h3>
                  <p className="text-sm text-muted-foreground">{result.trainName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent/20 mb-3">
                <p className="text-sm font-medium text-foreground">{result.runningStatus}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {result.currentStation} • Updated: {result.lastUpdated}
                </p>
              </div>
            </div>

            {/* Route Timeline */}
            <div className="glass-card p-4">
              <h4 className="font-semibold text-foreground mb-4">Route Timeline</h4>
              <div className="space-y-0">
                {result.route.map((station, idx) => (
                  <div key={station.stationCode} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        station.status === "departed" ? "bg-success" :
                        station.status === "arrived" ? "bg-primary" :
                        "bg-muted-foreground/30"
                      }`} />
                      {idx < result.route.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[40px] ${
                          station.status === "departed" ? "bg-success/50" : "bg-border"
                        }`} />
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {station.stationCode}
                            <span className="font-normal text-muted-foreground ml-1">
                              - {station.stationName}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {station.scheduledArrival || station.scheduledDeparture}
                            </span>
                            {station.delayInMins > 0 && (
                              <span className={`text-xs font-medium ${getDelayColor(station.delayInMins)}`}>
                                +{station.delayInMins} min
                              </span>
                            )}
                          </div>
                        </div>

                        {station.platform && (
                          <span className="px-2 py-1 rounded bg-muted text-xs font-medium text-muted-foreground">
                            PF {station.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
