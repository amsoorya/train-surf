import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/LoadingSpinner";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { StationAutocomplete } from "@/components/StationAutocomplete";
import { TrainSurfRequest, TrainSurfResult, CLASS_OPTIONS, QUOTA_OPTIONS } from "@/types/trainsurf";
import { CalendarIcon, History, Rocket, LogOut, FlaskConical, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainSurfResult | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState<Partial<TrainSurfRequest>>({
    trainNo: "",
    source: "",
    destination: "",
    classType: "",
    quota: "GN",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trainNo || !formData.source || !formData.destination || !date || !formData.classType) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("trainsurf", {
        body: {
          trainNo: formData.trainNo,
          source: formData.source,
          destination: formData.destination,
          date: format(date, "yyyy-MM-dd"),
          classType: formData.classType,
          quota: formData.quota || "GN",
        } as TrainSurfRequest,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const resultData = response.data as TrainSurfResult;
      setResult(resultData);

      // Save to history
      if (user) {
        await supabase.from("search_history").insert([{
          user_id: user.id,
          train_no: formData.trainNo!,
          source: formData.source!,
          destination: formData.destination!,
          journey_date: format(date, "yyyy-MM-dd"),
          class_type: formData.classType!,
          quota: formData.quota || "GN",
          seat_changes: resultData.seatChanges,
          success: resultData.success,
          segments: JSON.parse(JSON.stringify(resultData.segments)),
        }]);
      }

      if (resultData.success) {
        toast({ title: `Found path with ${resultData.seatChanges} seat change(s)!` });
      } else {
        toast({ title: "No available path found", variant: "destructive" });
      }
    } catch (error) {
      console.error("TrainSurf error:", error);
      toast({ 
        title: "Error running algorithm", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const resetForm = () => {
    setResult(null);
    setFormData({ trainNo: "", source: "", destination: "", classType: "", quota: "GN" });
    setDate(new Date());
  };

  return (
    <div className="min-h-screen pb-8">
      {loading && <LoadingOverlay text="Running TrainSurf Algorithm..." />}
      
      <Header
        title="Smart Seat Stitching"
        subtitle="Find optimal seat combinations with minimal changes"
      >
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sandbox")} className="text-primary-foreground hover:bg-primary-foreground/20">
            <FlaskConical className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/history")} className="text-primary-foreground hover:bg-primary-foreground/20">
            <History className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/20">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </Header>

      <main className="px-4 -mt-4 space-y-6">
        {/* Welcome banner */}
        {!result && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">Pro Tip</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter station codes (e.g., NDLS, HWH) for faster search. Our AI finds the optimal path in seconds!
            </p>
          </div>
        )}

        {result ? (
          <ResultsDisplay result={result} onRunAgain={resetForm} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card p-5 space-y-4 animate-scale-in">
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
                  <StationAutocomplete
                    id="source"
                    placeholder="e.g., NDLS"
                    value={formData.source || ""}
                    onChange={(v) => setFormData({ ...formData, source: v })}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">To Station</Label>
                  <StationAutocomplete
                    id="destination"
                    placeholder="e.g., HWH"
                    value={formData.destination || ""}
                    onChange={(v) => setFormData({ ...formData, destination: v })}
                  />
                </div>
              </div>

              <div>
                <Label>Journey Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
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
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
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
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {QUOTA_OPTIONS.map((q) => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" variant="gradient" size="xl" className="w-full animate-slide-up delay-200">
              <Rocket className="w-5 h-5" />
              Run TrainSurf
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
