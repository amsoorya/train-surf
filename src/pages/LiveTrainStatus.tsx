import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Train, Clock, Navigation, RefreshCw, FlaskConical, MapPin, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useApp } from "@/contexts/AppContext";

interface LocationInfo {
  type: number;
  label: string;
  message: string;
  readable_message: string;
  hint: string;
}

interface NextStoppageInfo {
  next_stoppage_title: string;
  next_stoppage: string;
  next_stoppage_time_diff: string;
  next_stoppage_delay: number;
}

interface LiveTrainAPIData {
  success?: boolean;
  data?: {
    train_number: string;
    train_name: string;
    current_station_name: string;
    status: string;
    distance_from_source: number;
    total_distance: number;
    eta: string;
    etd: string;
    delay: number;
    next_stoppage_info: NextStoppageInfo;
    current_location_info: LocationInfo[];
    upcoming_stations_count: number;
  };
  error?: string;
  message?: string;
}

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

// Extended test data for tester mode
const TEST_LIVE_DATA_LIST: LiveTrainData[] = [
  {
    trainNo: "12301",
    trainName: "Rajdhani Express",
    currentStation: "Kanpur Central (CNB)",
    lastUpdated: new Date().toLocaleTimeString(),
    delay: "15 mins late",
    stations: [
      { stationName: "New Delhi", stationCode: "NDLS", arrivalTime: "-", departureTime: "16:55", delay: "On Time", distance: "0 km", isPassed: true, isCurrent: false },
      { stationName: "Kanpur Central", stationCode: "CNB", arrivalTime: "22:35", departureTime: "22:40", delay: "15 min late", distance: "440 km", isPassed: false, isCurrent: true },
      { stationName: "Prayagraj Jn", stationCode: "PRYJ", arrivalTime: "00:20", departureTime: "00:25", delay: "-", distance: "640 km", isPassed: false, isCurrent: false },
      { stationName: "Mughal Sarai", stationCode: "MGS", arrivalTime: "02:10", departureTime: "02:15", delay: "-", distance: "780 km", isPassed: false, isCurrent: false },
      { stationName: "Gaya Jn", stationCode: "GAYA", arrivalTime: "04:30", departureTime: "04:32", delay: "-", distance: "980 km", isPassed: false, isCurrent: false },
      { stationName: "Dhanbad Jn", stationCode: "DHN", arrivalTime: "06:45", departureTime: "06:50", delay: "-", distance: "1180 km", isPassed: false, isCurrent: false },
      { stationName: "Asansol Jn", stationCode: "ASN", arrivalTime: "07:40", departureTime: "07:42", delay: "-", distance: "1280 km", isPassed: false, isCurrent: false },
      { stationName: "Howrah Jn", stationCode: "HWH", arrivalTime: "10:05", departureTime: "-", delay: "-", distance: "1451 km", isPassed: false, isCurrent: false },
    ],
  },
  {
    trainNo: "12951",
    trainName: "Mumbai Rajdhani",
    currentStation: "Vadodara Jn (BRC)",
    lastUpdated: new Date().toLocaleTimeString(),
    delay: "On Time",
    stations: [
      { stationName: "Mumbai Central", stationCode: "BCT", arrivalTime: "-", departureTime: "17:00", delay: "On Time", distance: "0 km", isPassed: true, isCurrent: false },
      { stationName: "Borivali", stationCode: "BVI", arrivalTime: "17:22", departureTime: "17:24", delay: "On Time", distance: "32 km", isPassed: true, isCurrent: false },
      { stationName: "Surat", stationCode: "ST", arrivalTime: "19:52", departureTime: "19:57", delay: "On Time", distance: "263 km", isPassed: true, isCurrent: false },
      { stationName: "Vadodara Jn", stationCode: "BRC", arrivalTime: "21:35", departureTime: "21:45", delay: "On Time", distance: "392 km", isPassed: false, isCurrent: true },
      { stationName: "Ratlam Jn", stationCode: "RTM", arrivalTime: "01:05", departureTime: "01:15", delay: "-", distance: "598 km", isPassed: false, isCurrent: false },
      { stationName: "Kota Jn", stationCode: "KOTA", arrivalTime: "04:35", departureTime: "04:45", delay: "-", distance: "792 km", isPassed: false, isCurrent: false },
      { stationName: "New Delhi", stationCode: "NDLS", arrivalTime: "08:35", departureTime: "-", delay: "-", distance: "1384 km", isPassed: false, isCurrent: false },
    ],
  },
];

// Get random test live data
const getTestLiveData = (): LiveTrainData => {
  return TEST_LIVE_DATA_LIST[Math.floor(Math.random() * TEST_LIVE_DATA_LIST.length)];
};

export default function LiveTrainStatus() {
  const navigate = useNavigate();
  const { t, isTesterMode } = useApp();
  const [trainNo, setTrainNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<LiveTrainAPIData | null>(null);
  const [testData, setTestData] = useState<LiveTrainData | null>(null);

  const handleSearch = async () => {
    if (!trainNo) {
      toast({ title: t("error"), variant: "destructive" });
      return;
    }

    setLoading(true);
    setLiveData(null);
    setTestData(null);

    // Use test data if tester mode is on
    if (isTesterMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = getTestLiveData();
      setTestData({ ...data, trainNo });
      toast({ title: `${t("testerMode")}: ${t("success")}` });
      setLoading(false);
      return;
    }

    try {
      const { data: result, error } = await supabase.functions.invoke("live-train", {
        body: { trainNo }
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      // Check for API error messages
      if (result?.success === false || result?.error) {
        toast({ title: result.error || result.message || "Could not fetch train status", variant: "destructive" });
        return;
      }

      setLiveData(result);
    } catch (err) {
      console.error("Live train error:", err);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const trainData = liveData?.data;
  const hasData = (liveData?.success === true && trainData) || testData;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t("liveTrainStatus")} subtitle={t("trackTrain")}>
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
              <Label htmlFor="trainNo">{t("trainNumber")}</Label>
              <div className="relative mt-1">
                <Train className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="trainNo"
                  type="text"
                  placeholder="e.g., 12301"
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
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4 mr-2" /> {t("getStatus")}</>}
            </Button>
          </div>
        </div>

        {/* Real API Results */}
        {liveData?.success === true && trainData && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{trainData.train_number} - {trainData.train_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("currentLocation")}: {trainData.current_station_name}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSearch}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Delay Info */}
            <div className={`p-3 rounded-lg mb-4 ${trainData.delay === 0 ? "bg-success/10" : "bg-warning/10"}`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${trainData.delay === 0 ? "text-success" : "text-warning"}`} />
                <span className={`font-medium ${trainData.delay === 0 ? "text-success" : "text-warning"}`}>
                  {trainData.delay === 0 ? t("onTime") : `${trainData.delay} mins late`}
                </span>
              </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="font-semibold text-foreground">{trainData.eta}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">ETD</p>
                <p className="font-semibold text-foreground">{trainData.etd}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Distance Covered</p>
                <p className="font-semibold text-foreground">{trainData.distance_from_source} km</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Distance</p>
                <p className="font-semibold text-foreground">{trainData.total_distance} km</p>
              </div>
            </div>

            {/* Next Stoppage */}
            {trainData.next_stoppage_info && (
              <div className="p-4 bg-primary/10 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{trainData.next_stoppage_info.next_stoppage_title}</span>
                </div>
                <p className="font-semibold text-foreground">{trainData.next_stoppage_info.next_stoppage}</p>
                <p className="text-sm text-muted-foreground">{trainData.next_stoppage_info.next_stoppage_time_diff}</p>
                {trainData.next_stoppage_info.next_stoppage_delay > 0 && (
                  <p className="text-sm text-warning mt-1">Delay: {trainData.next_stoppage_info.next_stoppage_delay} mins</p>
                )}
              </div>
            )}

            {/* Current Location Info */}
            {trainData.current_location_info && trainData.current_location_info.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-foreground">{t("currentLocation")}</h4>
                {trainData.current_location_info.map((info, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{info.readable_message || info.message}</p>
                        <p className="text-xs text-muted-foreground">{info.label}</p>
                        {info.hint && <p className="text-xs text-primary mt-1">{info.hint}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming Stations Count */}
            {trainData.upcoming_stations_count > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                {trainData.upcoming_stations_count} stations remaining
              </p>
            )}
          </div>
        )}

        {/* Test Mode Results */}
        {testData && !testData.error && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{testData.trainNo} - {testData.trainName}</h3>
                <p className="text-sm text-muted-foreground">
                  {testData.currentStation && <>{t("currentLocation")}: {testData.currentStation}</>}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSearch}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Delay Info */}
            {testData.delay && (
              <div className={`p-3 rounded-lg mb-4 ${testData.delay.includes("On Time") ? "bg-success/10" : "bg-warning/10"}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${testData.delay.includes("On Time") ? "text-success" : "text-warning"}`} />
                  <span className={`font-medium ${testData.delay.includes("On Time") ? "text-success" : "text-warning"}`}>
                    {testData.delay.includes("On Time") ? t("onTime") : testData.delay}
                  </span>
                </div>
              </div>
            )}

            {/* Station Timeline */}
            {testData.stations && testData.stations.length > 0 && (
              <div className="space-y-0">
                <h4 className="font-semibold text-foreground mb-4">{t("route")}</h4>
                {testData.stations.map((station, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        station.isCurrent ? "bg-primary animate-pulse" :
                        station.isPassed ? "bg-success" : "bg-muted"
                      }`} />
                      {i < testData.stations!.length - 1 && (
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
            {testData.lastUpdated && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                {t("lastUpdate")}: {testData.lastUpdated}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
