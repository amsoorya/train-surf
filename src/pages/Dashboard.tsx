import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingOverlay } from "@/components/LoadingSpinner";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { TrainSurfRequest, TrainSurfResult, CLASS_OPTIONS, QUOTA_OPTIONS } from "@/types/trainsurf";
import { CalendarIcon, History, Rocket, LogOut } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainSurfResult | null>(null);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState<Partial<TrainSurfRequest>>({
    trainNo: "",
    source: "",
    destination: "",
    classType: "",
    quota: "GN",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trainNo || !formData.source || !formData.destination || !date || !formData.classType) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    // Simulate API call - replace with actual edge function call
    setTimeout(() => {
      const mockResult: TrainSurfResult = {
        success: true,
        segments: [
          { from: formData.source!, to: "INT1", status: "AVAILABLE-45", isAvailable: true },
          { from: "INT1", to: formData.destination!, status: "RAC-12", isAvailable: true },
        ],
        seatChanges: 1,
        apiCalls: 8,
        totalStations: 12,
      };
      setResult(mockResult);
      setLoading(false);
      
      // Save to history
      const history = JSON.parse(localStorage.getItem("trainsurf_history") || "[]");
      history.unshift({
        id: Date.now().toString(),
        ...formData,
        date: format(date, "yyyy-MM-dd"),
        seatChanges: mockResult.seatChanges,
        success: mockResult.success,
        timestamp: new Date().toISOString(),
        segments: mockResult.segments,
      });
      localStorage.setItem("trainsurf_history", JSON.stringify(history.slice(0, 50)));
    }, 3000);
  };

  const resetForm = () => {
    setResult(null);
    setFormData({ trainNo: "", source: "", destination: "", classType: "", quota: "GN" });
    setDate(undefined);
  };

  return (
    <div className="min-h-screen pb-8">
      {loading && <LoadingOverlay text="Running TrainSurf Algorithm..." />}
      
      <Header
        title="Smart Seat Stitching"
        subtitle="Find optimal seat combinations with minimal changes"
      >
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/history")} className="text-primary-foreground">
            <History className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="text-primary-foreground">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </Header>

      <main className="px-4 -mt-4 space-y-6">
        {result ? (
          <ResultsDisplay result={result} onRunAgain={resetForm} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card p-5 space-y-4">
              <div>
                <Label htmlFor="trainNo">Train Number</Label>
                <Input
                  id="trainNo"
                  placeholder="e.g., 12301"
                  value={formData.trainNo}
                  onChange={(e) => setFormData({ ...formData, trainNo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="source">From Station</Label>
                  <Input
                    id="source"
                    placeholder="e.g., NDLS"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">To Station</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., HWH"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <Label>Journey Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Class</Label>
                  <Select value={formData.classType} onValueChange={(v) => setFormData({ ...formData, classType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quota</Label>
                  <Select value={formData.quota} onValueChange={(v) => setFormData({ ...formData, quota: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {QUOTA_OPTIONS.map((q) => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" variant="gradient" size="xl" className="w-full">
              <Rocket className="w-5 h-5" />
              Run TrainSurf
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
