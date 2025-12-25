import { Segment } from "@/types/trainsurf";
import { TicketCard, StationDisplay, TicketFooter, StatusBadge } from "./TicketCard";
import { cn } from "@/lib/utils";

interface SegmentCardProps {
  segment: Segment;
  index: number;
  total: number;
}

function getVariant(status: string, isAvailable: boolean): "default" | "success" | "warning" | "error" {
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

  return (
    <TicketCard 
      variant={variant}
      className="animate-slide-up hover-lift"
      style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
    >
      {/* Booking number badge */}
      <div className="absolute top-3 left-6 z-10">
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Booking {index + 1} of {total}
        </span>
      </div>
      
      {/* Main station display with padding for badge */}
      <div className="pt-10">
        <StationDisplay
          fromCode={segment.from}
          toCode={segment.to}
        />
      </div>
      
      {/* Footer with status */}
      <TicketFooter className="flex items-center justify-between">
        <StatusBadge status={segment.status} isAvailable={segment.isAvailable} />
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            segment.isAvailable ? "bg-success" : "bg-destructive"
          )} />
          <span className="text-xs text-muted-foreground">
            {segment.isAvailable ? "Confirmed" : "Waitlisted"}
          </span>
        </div>
      </TicketFooter>
    </TicketCard>
  );
}
