import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Ticket, User, MapPin, Calendar, Train, Clock, ExternalLink, FlaskConical, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useApp } from "@/contexts/AppContext";

interface Passenger {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coach?: string;
  berth?: number;
}

interface PNRAPIData {
  success: boolean;
  data?: {
    pnr: string;
    trainNumber: string;
    trainName: string;
    journeyDate: string;
    bookingDate: string;
    source: string;
    destination: string;
    boardingPoint: string;
    class: string;
    chartPrepared: boolean;
    trainStatus: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    passengers: Passenger[];
    fare?: {
      bookingFare: string;
      ticketFare: string;
    };
    ratings?: {
      overall: number;
      food: number;
      punctuality: number;
      cleanliness: number;
      ratingCount: number;
    };
    hasPantry: boolean;
    isCancelled: boolean;
  };
  error?: string;
  message?: string;
}

interface PNRData {
  trainNo?: string;
  trainName?: string;
  doj?: string;
  from?: string;
  to?: string;
  boardingPoint?: string;
  class?: string;
  quota?: string;
  passengers?: Array<{
    number: number;
    bookingStatus: string;
    currentStatus: string;
  }>;
  chartStatus?: string;
  error?: string;
}

// Extended test data for tester mode
const TEST_PNR_DATA_LIST: PNRData[] = [
  {
    trainNo: "12301",
    trainName: "Rajdhani Express",
    doj: "25-12-2025",
    from: "NDLS",
    to: "HWH",
    boardingPoint: "NDLS",
    class: "3A",
    quota: "GN",
    chartStatus: "Chart Prepared",
    passengers: [
      { number: 1, bookingStatus: "CNF/B2/45", currentStatus: "CNF/B2/45" },
      { number: 2, bookingStatus: "CNF/B2/46", currentStatus: "CNF/B2/46" },
    ],
  },
  {
    trainNo: "12259",
    trainName: "Duronto Express",
    doj: "26-12-2025",
    from: "BCT",
    to: "NDLS",
    boardingPoint: "BCT",
    class: "2A",
    quota: "GN",
    chartStatus: "Chart Not Prepared",
    passengers: [
      { number: 1, bookingStatus: "WL/15", currentStatus: "WL/8" },
      { number: 2, bookingStatus: "WL/16", currentStatus: "WL/9" },
      { number: 3, bookingStatus: "WL/17", currentStatus: "WL/10" },
    ],
  },
];

// Get random test PNR data
const getTestPNRData = (): PNRData => {
  return TEST_PNR_DATA_LIST[Math.floor(Math.random() * TEST_PNR_DATA_LIST.length)];
};

export default function PNRStatus() {
  const navigate = useNavigate();
  const { t, isTesterMode } = useApp();
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<PNRAPIData | null>(null);
  const [testData, setTestData] = useState<PNRData | null>(null);

  const handleSearch = async () => {
    if (!pnr || pnr.length !== 10) {
      toast({ title: t("invalidPnr"), variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiData(null);
    setTestData(null);

    // Use test data if tester mode is on
    if (isTesterMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestData(getTestPNRData());
      toast({ title: `${t("testerMode")}: ${t("success")}` });
      setLoading(false);
      return;
    }

    try {
      const { data: result, error } = await supabase.functions.invoke("pnr-status", {
        body: { pnr }
      });

      if (error) throw error;
      
      // Handle API error response
      if (result?.success === false) {
        const errorMessage = result.error || result.message || "PNR not found";
        toast({ title: errorMessage, variant: "destructive" });
        return;
      }
      
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      setApiData(result);
    } catch (err) {
      console.error("PNR error:", err);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status?.includes("CNF") || status?.includes("Confirmed")) return "text-success";
    if (status?.includes("WL") || status?.includes("Waitlist")) return "text-warning";
    if (status?.includes("RAC")) return "text-primary";
    return "text-foreground";
  };

  const pnrData = apiData?.data;
  const hasRealData = apiData?.success === true && pnrData;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t("pnrStatus")} subtitle={t("checkBookingStatus")}>
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
              <Label htmlFor="pnr">{t("pnrNumber")}</Label>
              <div className="relative mt-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="pnr"
                  type="text"
                  placeholder={t("enterPnr")}
                  maxLength={10}
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.replace(/\D/g, ""))}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              variant="gradient" 
              className="w-full" 
              onClick={handleSearch}
              disabled={loading || pnr.length !== 10}
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4 mr-2" /> {t("checkStatus")}</>}
            </Button>
          </div>
        </div>

        {/* Real API Results */}
        {hasRealData && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Train className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{pnrData.trainNumber} - {pnrData.trainName}</h3>
                <p className="text-sm text-muted-foreground">{pnrData.class}</p>
              </div>
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fromStation")}</p>
                  <p className="font-medium text-foreground">{pnrData.source}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("toStation")}</p>
                  <p className="font-medium text-foreground">{pnrData.destination}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("journeyDate")}</p>
                  <p className="font-medium text-foreground">{pnrData.journeyDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("chartStatus")}</p>
                  <p className="font-medium text-foreground">{pnrData.chartPrepared ? "Chart Prepared" : "Not Prepared"}</p>
                </div>
              </div>
            </div>

            {/* Timing Details */}
            <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Departure</p>
                <p className="font-semibold text-foreground">{pnrData.departureTime}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{pnrData.duration}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Arrival</p>
                <p className="font-semibold text-foreground">{pnrData.arrivalTime}</p>
              </div>
            </div>

            {/* Boarding Point */}
            {pnrData.boardingPoint && (
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground">Boarding Point</p>
                <p className="font-medium text-foreground">{pnrData.boardingPoint}</p>
              </div>
            )}

            {/* Fare */}
            {pnrData.fare && (
              <div className="p-3 bg-primary/10 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground">Ticket Fare</p>
                <p className="font-semibold text-primary">₹{pnrData.fare.ticketFare}</p>
              </div>
            )}

            {/* Passengers */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground mb-2">{t("passengerDetails")} ({pnrData.passengers?.length || 0})</h4>
              {pnrData.passengers?.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{t("passenger")} {p.number}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(p.currentStatus)}`}>{p.currentStatus}</p>
                    <p className="text-xs text-muted-foreground">{t("bookingStatus")}: {p.bookingStatus}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Book on IRCTC */}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => window.open("https://www.irctc.co.in", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> {t("bookNow")}
            </Button>
          </div>
        )}

        {/* Test Mode Results */}
        {testData && !testData.error && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Train className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{testData.trainNo} - {testData.trainName}</h3>
                <p className="text-sm text-muted-foreground">{testData.class} • {testData.quota}</p>
              </div>
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fromStation")}</p>
                  <p className="font-medium text-foreground">{testData.from}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("toStation")}</p>
                  <p className="font-medium text-foreground">{testData.to}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("journeyDate")}</p>
                  <p className="font-medium text-foreground">{testData.doj}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("chartStatus")}</p>
                  <p className="font-medium text-foreground">{testData.chartStatus || "Not Prepared"}</p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground mb-2">{t("passengerDetails")}</h4>
              {testData.passengers?.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{t("passenger")} {p.number}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(p.currentStatus)}`}>{p.currentStatus}</p>
                    <p className="text-xs text-muted-foreground">{t("bookingStatus")}: {p.bookingStatus}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Book on IRCTC */}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => window.open("https://www.irctc.co.in", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> {t("bookNow")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
