import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { SegmentCard } from "@/components/SegmentCard";
import { Segment, TrainSurfResult } from "@/types/trainsurf";
import { ArrowLeft, Play, Info, Sparkles, Route, ChevronRight, Zap, Target, Lightbulb } from "lucide-react";

// Mock train data for sandbox testing
const MOCK_TRAINS = [
  {
    id: "12301",
    name: "Rajdhani Express",
    route: ["NDLS", "CNB", "ALD", "MGS", "DNR", "PNBE", "BJU", "KIR", "NJP", "HWH"],
    description: "New Delhi to Howrah via Patna"
  },
  {
    id: "12951",
    name: "Mumbai Rajdhani",
    route: ["BCT", "BRC", "RTM", "KOTA", "NZM"],
    description: "Mumbai to Delhi"
  },
  {
    id: "12627",
    name: "Karnataka Express",
    route: ["NZM", "AGC", "GWL", "BPL", "NGP", "SC", "SBC"],
    description: "Delhi to Bangalore"
  },
  {
    id: "12839",
    name: "Chennai Mail",
    route: ["HWH", "BBS", "VSKP", "BZA", "MAS"],
    description: "Howrah to Chennai"
  }
];

// Mock availability scenarios
const MOCK_SCENARIOS = [
  {
    id: "direct",
    name: "Direct Available",
    description: "Full journey available in one booking",
    icon: "🎯"
  },
  {
    id: "one_change",
    name: "One Seat Change",
    description: "Needs 1 intermediate stop",
    icon: "🔄"
  },
  {
    id: "two_changes",
    name: "Two Seat Changes",
    description: "Optimal path with 2 changes",
    icon: "🎯🔄"
  },
  {
    id: "no_path",
    name: "No Available Path",
    description: "All segments waitlisted",
    icon: "❌"
  }
];

export default function Sandbox() {
  const navigate = useNavigate();
  const [selectedTrain, setSelectedTrain] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [result, setResult] = useState<TrainSurfResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const train = MOCK_TRAINS.find(t => t.id === selectedTrain);

  const runSimulation = async () => {
    if (!train || !selectedScenario) return;

    setIsRunning(true);
    setResult(null);

    // Simulate algorithm execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const route = train.route;
    let segments: Segment[] = [];
    let success = true;
    let seatChanges = 0;

    switch (selectedScenario) {
      case "direct":
        segments = [{
          from: route[0],
          to: route[route.length - 1],
          status: "AVL 42",
          isAvailable: true
        }];
        seatChanges = 0;
        break;

      case "one_change":
        const midPoint1 = Math.floor(route.length / 2);
        segments = [
          { from: route[0], to: route[midPoint1], status: "AVL 28", isAvailable: true },
          { from: route[midPoint1], to: route[route.length - 1], status: "AVL 15", isAvailable: true }
        ];
        seatChanges = 1;
        break;

      case "two_changes":
        const third = Math.floor(route.length / 3);
        const twoThird = Math.floor((2 * route.length) / 3);
        segments = [
          { from: route[0], to: route[third], status: "AVL 31", isAvailable: true },
          { from: route[third], to: route[twoThird], status: "AVL 8", isAvailable: true },
          { from: route[twoThird], to: route[route.length - 1], status: "AVL 22", isAvailable: true }
        ];
        seatChanges = 2;
        break;

      case "no_path":
        segments = [{
          from: route[0],
          to: route[route.length - 1],
          status: "WL 45",
          isAvailable: false
        }];
        success = false;
        break;
    }

    setResult({
      success,
      segments,
      seatChanges,
      apiCalls: route.length - 1,
      totalStations: route.length
    });

    setIsRunning(false);
  };

  const resetSimulation = () => {
    setResult(null);
    setSelectedTrain("");
    setSelectedScenario("");
  };

  return (
    <div className="min-h-screen pb-8">
      <Header
        title="Sandbox Mode"
        subtitle="Test the algorithm with mock data"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="px-4 -mt-4 space-y-5">
        {/* How It Works Guide */}
        {showGuide && (
          <div className="glass-card p-5 animate-slide-up relative">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-warning" />
              <h3 className="font-bold text-foreground">How TrainSurf Works</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">The Problem</p>
                  <p className="text-xs text-muted-foreground">Sometimes direct tickets are waitlisted, but shorter segments might be available.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Our Solution</p>
                  <p className="text-xs text-muted-foreground">TrainSurf uses backward binary search to find optimal combinations with minimum seat changes.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">The Result</p>
                  <p className="text-xs text-muted-foreground">You get confirmed seats with minimal inconvenience instead of staying on waitlist!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Train Route Visualization */}
        {train && !result && (
          <div className="glass-card p-5 animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Train Route</span>
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {train.route.map((station, idx) => (
                <div key={station} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-muted-foreground mt-1">{station}</span>
                  </div>
                  {idx < train.route.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {result ? (
          <div className="animate-slide-up">
            <ResultsDisplay result={result} onRunAgain={resetSimulation} />
            
            <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-accent">Sandbox Mode:</span> This is simulated data for testing. 
                  Use the Dashboard with real train numbers to get actual availability from IRCTC.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select Train */}
            <div className="glass-card p-5 space-y-3 animate-slide-up delay-100">
              <Label className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                Select a Test Train
              </Label>
              <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a train route" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TRAINS.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div>
                        <span className="font-semibold">{t.id}</span> - {t.name}
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Scenario */}
            <div className="glass-card p-5 space-y-3 animate-slide-up delay-200">
              <Label className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                Select Availability Scenario
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScenario(s.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedScenario === s.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <p className="font-semibold text-sm text-foreground mt-1">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <Button 
              variant="gradient" 
              size="xl" 
              className="w-full animate-slide-up delay-300"
              disabled={!selectedTrain || !selectedScenario || isRunning}
              onClick={runSimulation}
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
