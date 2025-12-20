import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Train, Clock, ExternalLink, Calendar, FlaskConical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StationAutocomplete } from "@/components/StationAutocomplete";
import { useApp } from "@/contexts/AppContext";
import { format } from "date-fns";

interface TrainResult {
  trainNo: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  runningDays: string[];
}

// Test data for tester mode
const TEST_TRAINS: TrainResult[] = [
  { trainNo: "12301", trainName: "Rajdhani Express", fromStation: "NDLS", toStation: "HWH", departureTime: "16:55", arrivalTime: "10:05", duration: "17h 10m", runningDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { trainNo: "12305", trainName: "Kolkata Rajdhani", fromStation: "NDLS", toStation: "HWH", departureTime: "17:00", arrivalTime: "10:15", duration: "17h 15m", runningDays: ["Mon", "Wed", "Fri"] },
  { trainNo: "12259", trainName: "Duronto Express", fromStation: "NDLS", toStation: "HWH", departureTime: "20:15", arrivalTime: "14:30", duration: "18h 15m", runningDays: ["Tue", "Sat"] },
  { trainNo: "12313", trainName: "Sealdah Rajdhani", fromStation: "NDLS", toStation: "SDAH", departureTime: "16:30", arrivalTime: "10:00", duration: "17h 30m", runningDays: ["Daily"] },
];

export default function TrainsBetween() {
  const navigate = useNavigate();
  const { t, isTesterMode } = useApp();
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [date, setDate] = useState(format(new Date(), "dd-MM-yyyy"));
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<TrainResult[]>([]);

  const handleSearch = async () => {
    if (!fromStation || !toStation) {
      toast({ title: `${t("selectSource")} & ${t("selectDestination")}`, variant: "destructive" });
      return;
    }

    setLoading(true);
    setTrains([]);

    // Use test data if tester mode is on
    if (isTesterMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTrains(TEST_TRAINS);
      toast({ title: `${t("testerMode")}: ${TEST_TRAINS.length} trains found` });
      setLoading(false);
      return;
    }

    try {
      const { data: result, error } = await supabase.functions.invoke("trains-between", {
        body: { fromStation, toStation, date }
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      const trainList = result?.data || result?.trains || [];
      setTrains(Array.isArray(trainList) ? trainList : []);
      
      if (trainList.length === 0) {
        toast({ title: t("noResults") });
      }
    } catch (err) {
      console.error("Trains between error:", err);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t("trainsBetween")} subtitle={t("findTrains")}>
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
        {/* Tester Mode Banner */}
        {isTesterMode && (
          <div className="p-2 mb-4 bg-warning/20 border border-warning rounded-lg flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-warning" />
            <span className="text-sm text-warning font-medium">{t("testerModeOn")} - {t("usingTestData")}</span>
          </div>
        )}

        {/* Search Card */}
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <div className="space-y-4">
            <div>
              <Label>{t("fromStation")}</Label>
              <StationAutocomplete
                id="fromStation"
                value={fromStation}
                onChange={setFromStation}
                placeholder={t("selectSource")}
              />
            </div>
            <div>
              <Label>{t("toStation")}</Label>
              <StationAutocomplete
                id="toStation"
                value={toStation}
                onChange={setToStation}
                placeholder={t("selectDestination")}
              />
            </div>
            <div>
              <Label htmlFor="date">{t("journeyDate")}</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="date"
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              variant="gradient" 
              className="w-full" 
              onClick={handleSearch}
              disabled={loading || !fromStation || !toStation}
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4 mr-2" /> {t("searchTrains")}</>}
            </Button>
          </div>
        </div>

        {/* Results */}
        {trains.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{trains.length} trains found</p>
            {trains.map((train, i) => (
              <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Train className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{train.trainNo} - {train.trainName}</h3>
                    <p className="text-xs text-muted-foreground">{t("runsOn")}: {train.runningDays?.join(", ") || "Daily"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{train.departureTime}</p>
                    <p className="text-xs text-muted-foreground">{train.fromStation}</p>
                  </div>
                  <div className="flex-1 flex items-center px-4">
                    <div className="flex-1 h-0.5 bg-border" />
                    <div className="px-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {train.duration}
                    </div>
                    <div className="flex-1 h-0.5 bg-border" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{train.arrivalTime}</p>
                    <p className="text-xs text-muted-foreground">{train.toStation}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => window.open(`https://www.irctc.co.in/nget/train-search`, "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> {t("bookNow")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
