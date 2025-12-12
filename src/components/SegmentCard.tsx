import { Segment } from "@/types/trainsurf";
import { ArrowRight, Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentCardProps {
  segment: Segment;
  index: number;
  total: number;
}

function getStatusStyle(status: string, isAvailable: boolean) {
  const s = status.toUpperCase();
  
  if (s.includes("AVAILABLE") || s.includes("CNF") || s.includes("CONFIRM") || isAvailable) {
    return {
      className: "status-available",
      icon: Check,
      label: status,
    };
  }
  
  if (s.includes("RAC")) {
    return {
      className: "status-rac",
      icon: AlertTriangle,
      label: status,
    };
  }
  
  return {
    className: "status-unavailable",
    icon: X,
    label: status,
  };
}

export function SegmentCard({ segment, index, total }: SegmentCardProps) {
  const statusInfo = getStatusStyle(segment.status, segment.isAvailable);
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="segment-card p-4 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
          Booking {index + 1} of {total}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
          <p className="text-lg font-bold text-foreground">{segment.from}</p>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">To</p>
          <p className="text-lg font-bold text-foreground">{segment.to}</p>
        </div>
      </div>
      
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", statusInfo.className)}>
        <StatusIcon className="w-3 h-3" />
        {statusInfo.label}
      </div>
    </div>
  );
}
