import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { StationAutocomplete } from "@/components/StationAutocomplete";
import { Segment, TrainSurfResult, CLASS_OPTIONS, QUOTA_OPTIONS } from "@/types/trainsurf";
import { ArrowLeft, Play, Info, Sparkles, Route, ChevronRight, Zap, Target, Lightbulb, Train, ArrowRightLeft } from "lucide-react";

// 15 Mock trains with varied routes for testing
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
    route: ["BCT", "BRC", "RTM", "KOTA", "SWM", "NZM"],
    description: "Mumbai to Delhi"
  },
  {
    id: "12627",
    name: "Karnataka Express",
    route: ["NZM", "AGC", "GWL", "JHS", "BPL", "ET", "NGP", "BPQ", "SC", "SBC"],
    description: "Delhi to Bangalore via Hyderabad"
  },
  {
    id: "12839",
    name: "Chennai Mail",
    route: ["HWH", "KGP", "BBS", "VSKP", "RJY", "BZA", "GDR", "MAS"],
    description: "Howrah to Chennai"
  },
  {
    id: "12259",
    name: "Duronto Express",
    route: ["SDAH", "ASN", "GAYA", "MGS", "ALD", "CNB", "NDLS"],
    description: "Sealdah to New Delhi"
  },
  {
    id: "12621",
    name: "Tamil Nadu Express",
    route: ["NDLS", "AGC", "GWL", "JHS", "BPL", "NGP", "BZA", "MAS"],
    description: "New Delhi to Chennai"
  },
  {
    id: "12423",
    name: "Dibrugarh Rajdhani",
    route: ["NDLS", "CNB", "LKO", "GKP", "MFP", "KIR", "NJP", "AGTL", "DBRG"],
    description: "New Delhi to Dibrugarh"
  },
  {
    id: "12245",
    name: "Shatabdi Express",
    route: ["HWH", "BWN", "DGR", "ASN", "GMO", "DHN", "JSME"],
    description: "Howrah to Dhanbad"
  },
  {
    id: "12903",
    name: "Golden Temple Mail",
    route: ["BCT", "BRC", "RTM", "KOTA", "SWM", "NZM", "NDLS", "UMB", "CDG", "ASR"],
    description: "Mumbai to Amritsar"
  },
  {
    id: "12431",
    name: "Trivandrum Rajdhani",
    route: ["NDLS", "KOTA", "RTM", "BRC", "PNVL", "MAO", "MAJN", "CLT", "ERS", "TVC"],
    description: "New Delhi to Thiruvananthapuram"
  },
  {
    id: "12802",
    name: "Purushottam Express",
    route: ["NDLS", "CNB", "ALD", "MGS", "DNR", "PNBE", "KGP", "BBS", "PURI"],
    description: "New Delhi to Puri"
  },
  {
    id: "12309",
    name: "Rajdhani Express",
    route: ["PNBE", "DNR", "MGS", "ALD", "CNB", "NDLS"],
    description: "Patna to New Delhi"
  },
  {
    id: "12559",
    name: "Shiv Ganga Express",
    route: ["NDLS", "CNB", "ALD", "MGS", "DDU", "BSB"],
    description: "New Delhi to Varanasi"
  },
  {
    id: "22691",
    name: "Bengaluru Rajdhani",
    route: ["NDLS", "KOTA", "RTM", "BRC", "PUNE", "SBC"],
    description: "New Delhi to Bangalore"
  },
  {
    id: "12295",
    name: "Sanghamitra Express",
    route: ["SBC", "SSPN", "GTL", "SC", "BZA", "RJY", "VSKP", "BBS", "KGP", "HWH", "DBRG"],
    description: "Bangalore to Dibrugarh"
  }
];

// Enhanced mock scenarios
const MOCK_SCENARIOS = [
  {
    id: "direct",
    name: "Direct Available",
    description: "Full journey in one booking",
    icon: "🎯",
    hops: 0
  },
  {
    id: "minimum_hops",
    name: "Minimum Hops (1-2)",
    description: "Optimal with fewest changes",
    icon: "✨",
    hops: 1
  },
  {
    id: "medium_hops",
    name: "Medium Hops (3-4)",
    description: "Moderate seat changes",
    icon: "🔄",
    hops: 3
  },
  {
    id: "maximum_hops",
    name: "Maximum Hops",
    description: "Every station hop",
    icon: "🔁",
    hops: -1
  },
  {
    id: "overlapping",
    name: "Overlapping Segments",
    description: "Segments overlap at stations",
    icon: "🔀",
    hops: 2
  },
  {
    id: "wl_path",
    name: "Waitlist Alert",
    description: "WL seats could complete path",
    icon: "⚠️",
    hops: 2
  },
  {
    id: "no_path",
    name: "No Path Found",
    description: "All segments unavailable",
    icon: "❌",
    hops: 0
  }
];

export default function Sandbox() {
  const navigate = useNavigate();
  const [selectedTrain, setSelectedTrain] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [sourceStation, setSourceStation] = useState<string>("");
  const [destStation, setDestStation] = useState<string>("");
  const [classType, setClassType] = useState<string>("3A");
  const [quota, setQuota] = useState<string>("GN");
  const [result, setResult] = useState<TrainSurfResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const train = MOCK_TRAINS.find(t => t.id === selectedTrain);

  // Auto-select source and destination when train is selected
  const handleTrainSelect = (trainId: string) => {
    setSelectedTrain(trainId);
    const t = MOCK_TRAINS.find(tr => tr.id === trainId);
    if (t) {
      setSourceStation(t.route[0]);
      setDestStation(t.route[t.route.length - 1]);
    }
  };

  const runSimulation = async () => {
    if (!train || !selectedScenario || !sourceStation || !destStation) return;

    setIsRunning(true);
    setResult(null);

    // Simulate algorithm execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const route = train.route;
    const srcIdx = route.indexOf(sourceStation);
    const dstIdx = route.indexOf(destStation);
    
    if (srcIdx === -1 || dstIdx === -1 || srcIdx >= dstIdx) {
      setResult({
        success: false,
        segments: [],
        seatChanges: 0,
        apiCalls: 1,
        totalStations: route.length,
        error: "Invalid station selection"
      });
      setIsRunning(false);
      return;
    }

    const relevantRoute = route.slice(srcIdx, dstIdx + 1);
    let segments: Segment[] = [];
    let success = true;
    let seatChanges = 0;

    switch (selectedScenario) {
      case "direct":
        segments = [{
          from: relevantRoute[0],
          to: relevantRoute[relevantRoute.length - 1],
          status: `AVL ${Math.floor(Math.random() * 50) + 10}`,
          isAvailable: true
        }];
        seatChanges = 0;
        break;

      case "minimum_hops":
        const mid1 = Math.floor(relevantRoute.length / 2);
        segments = [
          { from: relevantRoute[0], to: relevantRoute[mid1], status: `AVL ${Math.floor(Math.random() * 30) + 5}`, isAvailable: true },
          { from: relevantRoute[mid1], to: relevantRoute[relevantRoute.length - 1], status: `RAC ${Math.floor(Math.random() * 10) + 1}`, isAvailable: true }
        ];
        seatChanges = 1;
        break;

      case "medium_hops":
        const step = Math.max(1, Math.floor(relevantRoute.length / 4));
        segments = [];
        for (let i = 0; i < relevantRoute.length - 1; i += step) {
          const end = Math.min(i + step, relevantRoute.length - 1);
          if (i < end) {
            segments.push({
              from: relevantRoute[i],
              to: relevantRoute[end],
              status: `AVL ${Math.floor(Math.random() * 25) + 5}`,
              isAvailable: true
            });
          }
        }
        seatChanges = segments.length - 1;
        break;

      case "maximum_hops":
        segments = [];
        for (let i = 0; i < relevantRoute.length - 1; i++) {
          segments.push({
            from: relevantRoute[i],
            to: relevantRoute[i + 1],
            status: `AVL ${Math.floor(Math.random() * 20) + 3}`,
            isAvailable: true
          });
        }
        seatChanges = segments.length - 1;
        break;

      case "overlapping":
        // Demonstrate overlapping segments: 0-5 and 4-10 style
        const overlap = Math.floor(relevantRoute.length / 3);
        const mid = Math.floor(relevantRoute.length / 2);
        segments = [
          { from: relevantRoute[0], to: relevantRoute[mid + 1], status: `AVL ${Math.floor(Math.random() * 20) + 10}`, isAvailable: true },
          { from: relevantRoute[mid - 1], to: relevantRoute[relevantRoute.length - 1], status: `AVL ${Math.floor(Math.random() * 15) + 5}`, isAvailable: true }
        ];
        seatChanges = 1;
        break;

      case "wl_path":
        const wlMid = Math.floor(relevantRoute.length / 2);
        segments = [
          { from: relevantRoute[0], to: relevantRoute[wlMid], status: `AVL ${Math.floor(Math.random() * 20) + 5}`, isAvailable: true },
          { from: relevantRoute[wlMid], to: relevantRoute[relevantRoute.length - 1], status: "WL 8", isAvailable: false }
        ];
        seatChanges = 1;
        success = false;
        break;

      case "no_path":
        segments = [{
          from: relevantRoute[0],
          to: relevantRoute[relevantRoute.length - 1],
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
      apiCalls: relevantRoute.length - 1,
      totalStations: relevantRoute.length,
      debugInfo: [
        `Route: ${relevantRoute.join(" → ")}`,
        `Scenario: ${selectedScenario}`,
        `Total stations: ${relevantRoute.length}`,
        `Seat changes: ${seatChanges}`,
        success ? "✅ Path found successfully!" : "❌ No available path"
      ]
    });

    setIsRunning(false);
  };

  const resetSimulation = () => {
    setResult(null);
    setSelectedTrain("");
    setSelectedScenario("");
    setSourceStation("");
    setDestStation("");
  };

  return (
    <div className="min-h-screen pb-24">
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
                  <p className="text-xs text-muted-foreground">TrainSurf uses backward binary search to find optimal combinations with minimum seat changes. Even overlapping segments work!</p>
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

        {result ? (
          <div className="animate-slide-up">
            <ResultsDisplay result={result} onRunAgain={resetSimulation} />
            
            {/* Show hops visualization */}
            {result.success && result.segments.length > 1 && (
              <div className="glass-card p-4 mt-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  Seat Change Points ({result.seatChanges} hops)
                </h4>
                <div className="flex items-center flex-wrap gap-2">
                  {result.segments.map((seg, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="px-3 py-1.5 rounded-lg bg-success/20 text-success text-sm font-medium">
                        {seg.from} → {seg.to}
                      </div>
                      {idx < result.segments.length - 1 && (
                        <div className="mx-2 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-warning">↻</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
            <div className="glass-card p-5 space-y-3 animate-slide-up">
              <Label className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                Select a Test Train
              </Label>
              <Select value={selectedTrain} onValueChange={handleTrainSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose from 15 test trains" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {MOCK_TRAINS.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-semibold">{t.id}</span> - {t.name}
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Train Route Visualization */}
            {train && (
              <div className="glass-card p-5 animate-scale-in">
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Train Route ({train.route.length} stations)</span>
                </div>
                
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {train.route.map((station, idx) => (
                    <div key={station} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          station === sourceStation ? "bg-success ring-2 ring-success/50" :
                          station === destStation ? "bg-destructive ring-2 ring-destructive/50" :
                          "bg-primary"
                        }`} />
                        <span className="text-xs font-medium text-muted-foreground mt-1">{station}</span>
                      </div>
                      {idx < train.route.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Station Selection */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <Label className="text-xs">From Station</Label>
                    <Select value={sourceStation} onValueChange={setSourceStation}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        {train.route.slice(0, -1).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">To Station</Label>
                    <Select value={destStation} onValueChange={setDestStation}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent>
                        {train.route.slice(1).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Class and Quota */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-xs">Class</Label>
                    <Select value={classType} onValueChange={setClassType}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Quota</Label>
                    <Select value={quota} onValueChange={setQuota}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTA_OPTIONS.map(q => (
                          <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Select Scenario */}
            <div className="glass-card p-5 space-y-3 animate-slide-up delay-100">
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
              className="w-full animate-slide-up delay-200"
              disabled={!selectedTrain || !selectedScenario || !sourceStation || !destStation || isRunning}
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
