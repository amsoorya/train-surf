import { Segment, PathOption } from "@/types/trainsurf";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// Segment colors for visual distinction
const SEGMENT_COLORS = [
  "bg-emerald-500",
  "bg-blue-500", 
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-lime-500",
];

interface JourneyPathDisplayProps {
  path: PathOption;
  isExpanded?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function JourneyPathDisplay({ path, isExpanded = false, isSelected = false, onClick }: JourneyPathDisplayProps) {
  const getStatusIcon = () => {
    if (path.type === 'direct') return <Check className="w-4 h-4 text-success" />;
    if (path.type === 'wl_partial') return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <Check className="w-4 h-4 text-primary" />;
  };

  const getStatusBg = () => {
    if (path.type === 'direct') return 'bg-success/10 border-success/30';
    if (path.type === 'wl_partial') return 'bg-warning/10 border-warning/30';
    return 'bg-primary/10 border-primary/30';
  };

  return (
    <div 
      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${getStatusBg()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-foreground text-sm">{path.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
            {path.seatChanges === 0 ? 'Direct' : `${path.seatChanges} hop${path.seatChanges > 1 ? 's' : ''}`}
          </span>
          {onClick && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </div>
      </div>

      {/* Single Line Journey Visualization */}
      <div className="relative">
        {/* Track line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Colored segments on track */}
        <div className="relative flex items-center">
          {path.segments.map((segment, idx) => {
            const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
            const isWL = !segment.isAvailable;
            
            return (
              <div key={idx} className="flex-1 relative">
                {/* Segment bar */}
                <div className={`h-2 rounded-full mx-0.5 ${isWL ? 'bg-destructive/60 animate-pulse' : color}`} />
                
                {/* Station dot - start */}
                <div className={`absolute -top-1.5 left-0 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold text-white ${isWL ? 'bg-destructive' : color}`}>
                  {idx + 1}
                </div>
                
                {/* Station dot - end (only for last segment) */}
                {idx === path.segments.length - 1 && (
                  <div className={`absolute -top-1.5 right-0 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${isWL ? 'bg-destructive' : color}`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Station labels */}
        <div className="flex justify-between mt-3">
          <span className="text-xs font-medium text-foreground">{path.segments[0]?.from}</span>
          <span className="text-xs font-medium text-foreground">{path.segments[path.segments.length - 1]?.to}</span>
        </div>
      </div>

      {/* Expanded segment details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          {path.segments.map((segment, idx) => {
            const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
            const textColor = color.replace('bg-', 'text-');
            
            return (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{segment.from}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-medium">{segment.to}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${segment.isAvailable ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {segment.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AllPathsDisplayProps {
  allPaths: PathOption[];
  wlPath?: PathOption;
  onSelectPath?: (path: PathOption) => void;
}

export function AllPathsDisplay({ allPaths, wlPath, onSelectPath }: AllPathsDisplayProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const directPath = allPaths.find(p => p.type === 'direct');
  const hopPaths = allPaths.filter(p => p.type === 'hops').sort((a, b) => a.seatChanges - b.seatChanges);

  return (
    <div className="space-y-4">
      {/* Direct Available */}
      {directPath && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            Direct Available
          </h4>
          <JourneyPathDisplay 
            path={directPath} 
            isExpanded={expandedIdx === 0}
            onClick={() => setExpandedIdx(expandedIdx === 0 ? null : 0)}
          />
        </div>
      )}

      {/* Hop Options */}
      {hopPaths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Available Paths ({hopPaths.length})
          </h4>
          <div className="space-y-2">
            {hopPaths.map((path, idx) => (
              <JourneyPathDisplay 
                key={idx}
                path={path} 
                isExpanded={expandedIdx === idx + 1}
                onClick={() => setExpandedIdx(expandedIdx === idx + 1 ? null : idx + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* WL Path Warning */}
      {wlPath && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Waitlist Alert
          </h4>
          <JourneyPathDisplay 
            path={wlPath} 
            isExpanded={expandedIdx === allPaths.length}
            onClick={() => setExpandedIdx(expandedIdx === allPaths.length ? null : allPaths.length)}
          />
          <p className="text-xs text-warning mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Some segments are waitlisted - may get confirmed closer to journey date
          </p>
        </div>
      )}

      {/* No path found */}
      {allPaths.length === 0 && !wlPath && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Path Found</h3>
          <p className="text-muted-foreground text-sm">
            No available seats for this journey. Try different dates or classes.
          </p>
        </div>
      )}
    </div>
  );
}