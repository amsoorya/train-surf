import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Ticket, User, MapPin, Calendar, Train, Clock, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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

export default function PNRStatus() {
  const navigate = useNavigate();
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PNRData | null>(null);

  const handleSearch = async () => {
    if (!pnr || pnr.length !== 10) {
      toast({ title: "Enter valid 10-digit PNR", variant: "destructive" });
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("pnr-status", {
        body: { pnr }
      });

      if (error) throw error;
      
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      setData(result);
    } catch (err) {
      console.error("PNR error:", err);
      toast({ title: "Failed to fetch PNR status", variant: "destructive" });
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="PNR Status" subtitle="Check your booking status">
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
              <Label htmlFor="pnr">PNR Number</Label>
              <div className="relative mt-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="pnr"
                  type="text"
                  placeholder="Enter 10-digit PNR"
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
              {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4 mr-2" /> Check Status</>}
            </Button>
          </div>
        </div>

        {/* Results */}
        {data && !data.error && (
          <div className="glass-card p-4 animate-slide-up">
            {/* Train Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Train className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{data.trainNo} - {data.trainName}</h3>
                <p className="text-sm text-muted-foreground">{data.class} • {data.quota}</p>
              </div>
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium text-foreground">{data.from}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-medium text-foreground">{data.to}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{data.doj}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Chart</p>
                  <p className="font-medium text-foreground">{data.chartStatus || "Not Prepared"}</p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground mb-2">Passengers</h4>
              {data.passengers?.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Passenger {p.number}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(p.currentStatus)}`}>{p.currentStatus}</p>
                    <p className="text-xs text-muted-foreground">Booked: {p.bookingStatus}</p>
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
              <ExternalLink className="w-4 h-4 mr-2" /> Open IRCTC
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
