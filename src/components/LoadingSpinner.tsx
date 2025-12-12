import { cn } from "@/lib/utils";
import { Train } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            "rounded-full border-4 border-primary/20 animate-pulse-ring absolute inset-0",
            sizes[size]
          )}
        />
        {/* Inner spinning ring */}
        <div
          className={cn(
            "rounded-full border-4 border-transparent border-t-primary animate-spin",
            sizes[size]
          )}
        />
        {/* Center icon */}
        <Train
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary",
            size === "sm" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-8 h-8"
          )}
        />
      </div>
      {text && (
        <p className="text-muted-foreground animate-pulse-soft text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="skeleton-loader h-4 w-3/4" />
      <div className="skeleton-loader h-4 w-1/2" />
      <div className="skeleton-loader h-8 w-full mt-4" />
    </div>
  );
}

export function LoadingOverlay({ text = "Processing..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-foreground font-semibold text-lg">{text}</p>
        <p className="text-muted-foreground text-sm">
          Finding the best seat combinations...
        </p>
      </div>
    </div>
  );
}
