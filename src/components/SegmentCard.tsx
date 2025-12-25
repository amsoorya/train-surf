import { Segment } from "@/types/trainsurf";
import { Train } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentCardProps {
  segment: Segment;
  index: number;
  total: number;
}

function getVariant(status: string, isAvailable: boolean): "success" | "warning" | "error" {
  const s = status.toUpperCase();
  
  if (s.includes("AVAILABLE") || s.includes("AVL") || s.includes("CNF") || s.includes("CONFIRM") || isAvailable) {
    return "success";
  }
  
  if (s.includes("RAC")) {
    return "warning";
  }
  
  return "error";
}

export function SegmentCard({ segment, index, total }: SegmentCardProps) {
  const variant = getVariant(segment.status, segment.isAvailable);
  
  const variantStyles = {
    success: "border-success bg-success/5",
    warning: "border-warning bg-warning/5", 
    error: "border-destructive bg-destructive/5",
  };

  return (
    <div 
      className="animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Ticket Container with notches */}
      <div className={cn(
        "relative rounded-2xl border-2 overflow-visible",
        variantStyles[variant]
      )}>
        {/* Left notch */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 border-inherit z-10" />
        {/* Right notch */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 border-inherit z-10" />
        
        {/* Inner content with padding for notches */}
        <div className="px-8 py-5">
          {/* Booking Badge */}
          <div className="mb-4">
            <span className={cn(
              "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest",
              variant === "success" && "bg-success/20 text-success",
              variant === "warning" && "bg-warning/20 text-warning",
              variant === "error" && "bg-destructive/20 text-destructive"
            )}>
              Booking {index + 1} of {total}
            </span>
          </div>
          
          {/* Station Display */}
          <div className="flex items-center justify-between gap-4">
            {/* From Station */}
            <div className="flex-shrink-0">
              <p className="text-3xl font-black text-foreground tracking-tight">{segment.from}</p>
            </div>
            
            {/* Journey Line with Train */}
            <div className="flex-1 flex items-center justify-center relative min-w-[120px]">
              {/* Dashed line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-primary/40" />
              
              {/* Train icon */}
              <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Train className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            
            {/* To Station */}
            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-black text-foreground tracking-tight">{segment.to}</p>
            </div>
          </div>
          
          {/* Footer with status */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-current/20">
            {/* Status Badge */}
            <span className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border",
              variant === "success" && "bg-success/15 text-success border-success/30",
              variant === "warning" && "bg-warning/15 text-warning border-warning/30",
              variant === "error" && "bg-destructive/15 text-destructive border-destructive/30"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                variant === "success" && "bg-success animate-pulse",
                variant === "warning" && "bg-warning animate-pulse",
                variant === "error" && "bg-destructive animate-pulse"
              )} />
              {segment.status}
            </span>
            
            {/* Confirmation status */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full",
                segment.isAvailable ? "bg-success" : "bg-destructive"
              )} />
              <span className="text-xs text-muted-foreground font-medium">
                {segment.isAvailable ? "Confirmed" : "Waitlisted"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
