import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Search, History, Star, FlaskConical, MessageCircle, 
  User, MapPin, Zap, ChevronRight, ChevronLeft, X, Sparkles
} from "lucide-react";

interface OnboardingGuideProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome to TrainSurf! 🚄",
    description: "Let's take a quick tour to help you get the most out of the app.",
    icon: Sparkles,
    color: "bg-primary/20 text-primary"
  },
  {
    title: "Smart Search",
    description: "Enter your train number, stations, date, and class. TrainSurf will find optimal seat combinations even when direct tickets are unavailable!",
    icon: Search,
    color: "bg-accent/20 text-accent"
  },
  {
    title: "Three Search Modes",
    description: "• Normal/Comfort: Checks direct availability only\n• Urgent: Runs full seat-stitching algorithm\n• Choose based on your travel needs!",
    icon: Zap,
    color: "bg-warning/20 text-warning"
  },
  {
    title: "Favorites",
    description: "Save your frequent routes for quick access. One tap to run your favorite search!",
    icon: Star,
    color: "bg-warning/20 text-warning"
  },
  {
    title: "Search History",
    description: "View all your past searches. Re-run any search with a single tap or delete entries you don't need.",
    icon: History,
    color: "bg-success/20 text-success"
  },
  {
    title: "Sandbox / Tester",
    description: "New to TrainSurf? Try the Tester mode to understand how seat-stitching works with simulated data!",
    icon: FlaskConical,
    color: "bg-accent/20 text-accent"
  },
  {
    title: "Need Help?",
    description: "Chat with TrainBot for quick answers or contact the developer directly for complex queries.",
    icon: MessageCircle,
    color: "bg-primary/20 text-primary"
  },
  {
    title: "You're All Set! 🎉",
    description: "Start searching for your perfect train journey. Happy travels!",
    icon: MapPin,
    color: "bg-success/20 text-success"
  }
];

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl ${currentStep.color} flex items-center justify-center mx-auto mb-4`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {currentStep.title}
          </h2>
          <p className="text-muted-foreground text-sm whitespace-pre-line">
            {currentStep.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={handlePrev} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button variant="gradient" onClick={handleNext} className="flex-1">
            {step < STEPS.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </div>

        {/* Skip button */}
        {step < STEPS.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
