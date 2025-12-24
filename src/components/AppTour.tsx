import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Search, History, Heart, User, Train, Ticket, Navigation, MessageCircle, Zap, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to TrainSurf! 🚂",
    description: "Let me show you around the app. This quick tour will help you get the most out of TrainSurf.",
    icon: <Train className="w-12 h-12 text-primary" />,
  },
  {
    title: "Smart Seat Stitching",
    description: "Our main feature! When direct tickets are waitlisted, TrainSurf finds confirmed segments on the same train and stitches them together for a complete journey.",
    icon: <Zap className="w-12 h-12 text-primary" />,
    highlight: "dashboard",
  },
  {
    title: "PNR Status",
    description: "Check your booking status instantly. Enter your 10-digit PNR to see current seat allocation and chart status.",
    icon: <Ticket className="w-12 h-12 text-success" />,
    highlight: "pnr",
  },
  {
    title: "Live Train Tracking",
    description: "Track any train in real-time. See current location, delays, and upcoming stations.",
    icon: <Navigation className="w-12 h-12 text-warning" />,
    highlight: "live",
  },
  {
    title: "Trains Between Stations",
    description: "Find all trains running between any two stations. Filter by date and see running days.",
    icon: <Map className="w-12 h-12 text-info" />,
    highlight: "trains",
  },
  {
    title: "Search History",
    description: "Access your past searches anytime. Quickly repeat successful queries without re-entering details.",
    icon: <History className="w-12 h-12 text-muted-foreground" />,
    highlight: "history",
  },
  {
    title: "Favorites",
    description: "Save your frequently used routes for quick access. One tap to run your favorite searches!",
    icon: <Heart className="w-12 h-12 text-destructive" />,
    highlight: "favorites",
  },
  {
    title: "Profile & Settings",
    description: "Manage your account, change theme, switch language (30+ languages supported!), and contact railways.",
    icon: <User className="w-12 h-12 text-secondary-foreground" />,
    highlight: "profile",
  },
  {
    title: "Need Help?",
    description: "Chat with TrainBot for instant answers about TrainSurf. You can also report bugs or share feedback in the Contact section.",
    icon: <MessageCircle className="w-12 h-12 text-primary" />,
    highlight: "contact",
  },
  {
    title: "You're All Set! 🎉",
    description: "Enjoy using TrainSurf! Remember: The algorithm works best for journeys where direct tickets are waitlisted. Happy travels!",
    icon: <Train className="w-12 h-12 text-primary" />,
  },
];

export function AppTour({ onComplete }: { onComplete: () => void }) {
  const { t } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">App Tour</span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            {step.icon}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>

          <Button
            variant="gradient"
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
            {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
