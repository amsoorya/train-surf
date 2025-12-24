import { useState } from "react";
import { Search, Calendar, Train, Users, Armchair, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { StationAutocomplete } from "@/components/StationAutocomplete";

const CLASS_TYPES = [
  { value: "1A", label: "First AC (1A)" },
  { value: "2A", label: "Second AC (2A)" },
  { value: "3A", label: "Third AC (3A)" },
  { value: "3E", label: "Third AC Economy (3E)" },
  { value: "SL", label: "Sleeper (SL)" },
  { value: "CC", label: "Chair Car (CC)" },
  { value: "2S", label: "Second Sitting (2S)" },
];

const QUOTA_TYPES = [
  { value: "GN", label: "General (GN)" },
  { value: "TQ", label: "Tatkal (TQ)" },
  { value: "PT", label: "Premium Tatkal (PT)" },
  { value: "LD", label: "Ladies (LD)" },
  { value: "HP", label: "Handicapped (HP)" },
  { value: "SS", label: "Senior Citizen (SS)" },
];

// Mock data for tester mode
const MOCK_AVAILABILITY = [
  {
    trainNo: "12301",
    trainName: "Howrah Rajdhani",
    availability: [
      { date: "2025-01-15", status: "AVAILABLE", seats: 45 },
      { date: "2025-01-16", status: "RAC", seats: 12 },
      { date: "2025-01-17", status: "WL", seats: -8 },
      { date: "2025-01-18", status: "AVAILABLE", seats: 23 },
      { date: "2025-01-19", status: "REGRET", seats: 0 },
      { date: "2025-01-20", status: "AVAILABLE", seats: 67 },
    ]
  },
  {
    trainNo: "12259",
    trainName: "Sealdah Duronto",
    availability: [
      { date: "2025-01-15", status: "AVAILABLE", seats: 12 },
      { date: "2025-01-16", status: "AVAILABLE", seats: 34 },
      { date: "2025-01-17", status: "RAC", seats: 5 },
      { date: "2025-01-18", status: "WL", seats: -15 },
      { date: "2025-01-19", status: "AVAILABLE", seats: 89 },
      { date: "2025-01-20", status: "RAC", seats: 3 },
    ]
  },
  {
    trainNo: "12951",
    trainName: "Mumbai Rajdhani",
    availability: [
      { date: "2025-01-15", status: "WL", seats: -22 },
      { date: "2025-01-16", status: "WL", seats: -18 },
      { date: "2025-01-17", status: "AVAILABLE", seats: 5 },
      { date: "2025-01-18", status: "AVAILABLE", seats: 41 },
      { date: "2025-01-19", status: "RAC", seats: 8 },
      { date: "2025-01-20", status: "AVAILABLE", seats: 56 },
    ]
  },
  {
    trainNo: "12002",
    trainName: "Bhopal Shatabdi",
    availability: [
      { date: "2025-01-15", status: "AVAILABLE", seats: 78 },
      { date: "2025-01-16", status: "AVAILABLE", seats: 92 },
      { date: "2025-01-17", status: "AVAILABLE", seats: 45 },
      { date: "2025-01-18", status: "RAC", seats: 2 },
      { date: "2025-01-19", status: "REGRET", seats: 0 },
      { date: "2025-01-20", status: "AVAILABLE", seats: 34 },
    ]
  },
  {
    trainNo: "12555",
    trainName: "Gorakhdham Express",
    availability: [
      { date: "2025-01-15", status: "RAC", seats: 15 },
      { date: "2025-01-16", status: "WL", seats: -5 },
      { date: "2025-01-17", status: "WL", seats: -12 },
      { date: "2025-01-18", status: "AVAILABLE", seats: 28 },
      { date: "2025-01-19", status: "AVAILABLE", seats: 65 },
      { date: "2025-01-20", status: "RAC", seats: 7 },
    ]
  },
];

export default function SeatAvailability() {
  const { t, isTesterMode } = useApp();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [classType, setClassType] = useState("SL");
  const [quota, setQuota] = useState("GN");
  const [trainNo, setTrainNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!source || !destination || !date) {
      toast.error("Please fill source, destination and date");
      return;
    }

    setLoading(true);
    setResults(null);

    // Use mock data in tester mode
    if (isTesterMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const randomResults = MOCK_AVAILABILITY.slice(0, Math.floor(Math.random() * 3) + 2);
      setResults({
        success: true,
        data: randomResults,
        classType,
        quota,
        source,
        destination
      });
      setLoading(false);
      toast.success("Mock data loaded (Tester Mode)");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('seat-availability', {
        body: { source, destination, date, classType, quota, trainNo }
      });

      if (error) throw error;
      setResults(data);
      toast.success("Availability fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch availability");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, seats?: number) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
      case 'AVL':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available {seats ? `(${seats})` : ''}
          </Badge>
        );
      case 'RAC':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            RAC {seats ? `(${seats})` : ''}
          </Badge>
        );
      case 'WL':
      case 'WAITLIST':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            WL {seats ? `(${Math.abs(seats)})` : ''}
          </Badge>
        );
      case 'REGRET':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Not Available
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Armchair className="w-5 h-5 text-primary" />
            {t("seatAvailability") || "Seat Availability"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("fromStation")}</Label>
              <StationAutocomplete
                id="seat-source"
                value={source}
                onChange={setSource}
                placeholder="From (e.g., NDLS)"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("toStation")}</Label>
              <StationAutocomplete
                id="seat-destination"
                value={destination}
                onChange={setDestination}
                placeholder="To (e.g., MAS)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("journeyDate")}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("classType")}</Label>
              <Select value={classType} onValueChange={setClassType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("quota")}</Label>
              <Select value={quota} onValueChange={setQuota}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTA_TYPES.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("trainNumber")} ({t("optional") || "Optional"})
            </Label>
            <div className="relative">
              <Train className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={trainNo}
                onChange={(e) => setTrainNo(e.target.value)}
                placeholder="e.g., 12301"
                className="pl-10"
                maxLength={5}
              />
            </div>
          </div>

          <Button
            variant="gradient"
            className="w-full"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {t("checkAvailability") || "Check Availability"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results?.data && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t("availabilityResults") || "Availability Results"}
            <Badge variant="outline" className="ml-auto">
              {results.classType} • {results.quota}
            </Badge>
          </h3>

          {results.data.map((train: any, index: number) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{train.trainName}</p>
                    <p className="text-sm text-muted-foreground">#{train.trainNo}</p>
                  </div>
                  <Train className="w-8 h-8 text-primary/30" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {train.availability?.slice(0, 6).map((avl: any, idx: number) => (
                    <div key={idx} className="text-center p-2 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(avl.date).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                      {getStatusBadge(avl.status, avl.seats)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results && !results.data && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">No availability data found</p>
            <p className="text-sm text-muted-foreground">Try different dates or stations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
