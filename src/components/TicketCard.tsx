import { CSSProperties, ReactNode } from "react";
import { Train } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "success" | "warning" | "error";
}

export function TicketCard({ children, className, style, variant = "default" }: TicketCardProps) {
  const variantStyles = {
    default: "border-primary/20 bg-card",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    error: "border-destructive/30 bg-destructive/5",
  };

  return (
    <div 
      className={cn(
        "relative rounded-2xl border-2 overflow-hidden",
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {/* Ticket notches on left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 border-border" />
      {/* Ticket notches on right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 border-border" />
      
      {children}
    </div>
  );
}

interface JourneyHeaderProps {
  trainNumber?: string;
  trainName?: string;
  duration?: string;
  className?: string;
}

export function JourneyHeader({ trainNumber, trainName, duration, className }: JourneyHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-3 border-b border-dashed border-border/50", className)}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Train className="w-4 h-4 text-primary" />
        </div>
        {trainNumber && (
          <div>
            <p className="text-xs text-muted-foreground">Train</p>
            <p className="font-bold text-foreground text-sm">{trainNumber}</p>
          </div>
        )}
      </div>
      {duration && (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-semibold text-foreground text-sm">{duration}</p>
        </div>
      )}
    </div>
  );
}

interface StationDisplayProps {
  fromCode: string;
  fromName?: string;
  fromTime?: string;
  toCode: string;
  toName?: string;
  toTime?: string;
  className?: string;
}

export function StationDisplay({ 
  fromCode, 
  fromName, 
  fromTime, 
  toCode, 
  toName, 
  toTime,
  className 
}: StationDisplayProps) {
  return (
    <div className={cn("px-6 py-4", className)}>
      <div className="flex items-center justify-between gap-4">
        {/* From Station */}
        <div className="flex-1 text-left">
          {fromName && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">{fromName}</p>
          )}
          <p className="text-2xl font-black text-primary tracking-tight">{fromCode}</p>
          {fromTime && (
            <p className="text-sm font-medium text-foreground mt-1">{fromTime}</p>
          )}
        </div>
        
        {/* Journey Line */}
        <div className="flex-1 flex items-center justify-center relative py-2">
          {/* Dashed line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-primary/30" />
          
          {/* Train icon in center */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow">
            <Train className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        
        {/* To Station */}
        <div className="flex-1 text-right">
          {toName && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">{toName}</p>
          )}
          <p className="text-2xl font-black text-primary tracking-tight">{toCode}</p>
          {toTime && (
            <p className="text-sm font-medium text-foreground mt-1">{toTime}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface TicketFooterProps {
  children: ReactNode;
  className?: string;
}

export function TicketFooter({ children, className }: TicketFooterProps) {
  return (
    <div className={cn("px-6 py-3 border-t border-dashed border-border/50 bg-muted/30", className)}>
      {children}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  isAvailable: boolean;
  className?: string;
}

export function StatusBadge({ status, isAvailable, className }: StatusBadgeProps) {
  const s = status.toUpperCase();
  
  let variant: "success" | "warning" | "error" = "error";
  if (s.includes("AVAILABLE") || s.includes("AVL") || s.includes("CNF") || s.includes("CONFIRM") || isAvailable) {
    variant = "success";
  } else if (s.includes("RAC")) {
    variant = "warning";
  }
  
  const variantStyles = {
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    error: "bg-destructive/15 text-destructive border-destructive/30",
  };
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
      variantStyles[variant],
      className
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full animate-pulse",
        variant === "success" && "bg-success",
        variant === "warning" && "bg-warning",
        variant === "error" && "bg-destructive"
      )} />
      {status}
    </span>
  );
}
