import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { TrainSurfRequest, TrainSurfResult, CLASS_OPTIONS, QUOTA_OPTIONS } from "@/types/trainsurf";
import { CalendarIcon, Rocket, Star, Zap, Shield, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import type { User } from "@supabase/supabase-js";

type SearchMode = "normal" | "urgent";

// Placeholder test data for tester mode
const TEST_RESULT: TrainSurfResult = {
  success: true,
  seatChanges: 1,
  segments: [
    { from: "NDLS", to: "CNB", status: "AVL 45", isAvailable: true },
    { from: "CNB", to: "HWH", status: "AVL 23", isAvailable: true },
  ],
  message: "Test Mode: Found path with 1 seat change",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isTesterMode } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainSurfResult | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("urgent");
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
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle pre-filled data from navigation state
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      setFormData({
        trainNo: state.trainNo || "",
        source: state.source || "",
        destination: state.destination || "",
        classType: state.classType || "",
        quota: state.quota || "GN",
      });
      if (state.date) {
        setDate(new Date(state.date));
      }
    }
  }, [location.state]);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      if (data && !data.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error updating onboarding status:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trainNo || !formData.source || !formData.destination || !date || !formData.classType) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    // If tester mode is on, use test data
    if (isTesterMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResult(TEST_RESULT);
      toast({ title: `${t("testerMode")}: Found path with ${TEST_RESULT.seatChanges} seat change(s)!` });
      setLoading(false);
      return;
    }

    try {
      const response = await supabase.functions.invoke("trainsurf", {
        body: {
          trainNo: formData.trainNo,
          source: formData.source,
          destination: formData.destination,
          date: format(date, "yyyy-MM-dd"),
          classType: formData.classType,
          quota: formData.quota || "GN",
          mode: searchMode,
        } as TrainSurfRequest & { mode: SearchMode },
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
        toast({ title: t("noResults"), variant: "destructive" });
      }
    } catch (error) {
      console.error("TrainSurf error:", error);
      toast({ 
        title: t("error"), 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async () => {
    if (!user || !formData.trainNo || !formData.source || !formData.destination || !formData.classType) {
      toast({ title: "Please fill all fields first", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("favorites").insert([{
        user_id: user.id,
        train_no: formData.trainNo,
        source: formData.source,
        destination: formData.destination,
        class_type: formData.classType,
        quota: formData.quota || "GN",
      }]);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already in favorites", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Added to favorites!" });
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast({ title: "Failed to add favorite", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData({ trainNo: "", source: "", destination: "", classType: "", quota: "GN" });
    setDate(new Date());
  };

  return (
    <div className="min-h-screen pb-24">
      {loading && <LoadingOverlay text={searchMode === "urgent" ? "Running TrainSurf Algorithm..." : "Checking Direct Availability..."} />}
      {showOnboarding && <OnboardingGuide onComplete={completeOnboarding} />}
      
      <Header
        title={t("smartSeatStitching")}
        subtitle={t("findOptimalSeats")}
      />

      {/* Tester Mode Banner */}
      {isTesterMode && (
        <div className="mx-4 -mt-2 mb-2 p-2 bg-warning/20 border border-warning rounded-lg flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-warning" />
          <span className="text-sm text-warning font-medium">{t("testerModeOn")} - {t("usingTestData")}</span>
        </div>
      )}

      <main className="px-4 -mt-4 space-y-4">
        {/* Search Mode Toggle */}
        <div className="glass-card p-4 animate-scale-in">
          <Label className="text-sm font-medium text-foreground mb-2 block">{t("searchMode")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSearchMode("normal")}
              className={cn(
                "p-3 rounded-xl border-2 transition-all text-left",
                searchMode === "normal" 
                  ? "border-success bg-success/10" 
                  : "border-border hover:border-success/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-success" />
                <span className="font-semibold text-sm text-foreground">{t("normal")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("checkDirect")}</p>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("urgent")}
              className={cn(
                "p-3 rounded-xl border-2 transition-all text-left",
                searchMode === "urgent" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">{t("urgent")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("fullAlgorithm")}</p>
            </button>
          </div>
        </div>

        {result ? (
          <div className="animate-slide-up">
            <ResultsDisplay result={result} onRunAgain={resetForm} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card p-5 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <Label htmlFor="trainNo">{t("trainNumber")}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addToFavorites}
                  className="text-warning hover:text-warning"
                >
                  <Star className="w-4 h-4 mr-1" />
                  {t("save")}
                </Button>
              </div>
              <Input
                id="trainNo"
                placeholder="e.g., 12301"
                value={formData.trainNo}
                onChange={(e) => setFormData({ ...formData, trainNo: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="source">{t("fromStation")}</Label>
                  <StationAutocomplete
                    id="source"
                    placeholder="e.g., NDLS"
                    value={formData.source || ""}
                    onChange={(v) => setFormData({ ...formData, source: v })}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">{t("toStation")}</Label>
                  <StationAutocomplete
                    id="destination"
                    placeholder="e.g., HWH"
                    value={formData.destination || ""}
                    onChange={(v) => setFormData({ ...formData, destination: v })}
                  />
                </div>
              </div>

              <div>
                <Label>{t("journeyDate")}</Label>
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
                  <Label>{t("classLabel")}</Label>
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
                  <Label>{t("quota")}</Label>
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

            <Button type="submit" variant="gradient" size="xl" className="w-full animate-slide-up delay-100">
              <Rocket className="w-5 h-5" />
              {t("runTrainSurf")}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
