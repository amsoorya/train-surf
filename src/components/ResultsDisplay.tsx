import { TrainSurfResult } from "@/types/trainsurf";
import { SegmentCard } from "./SegmentCard";
import { TicketCard, JourneyHeader, StationDisplay, TicketFooter } from "./TicketCard";
import { Button } from "./ui/button";
import { Copy, Download, RefreshCw, Check, AlertCircle, Sparkles, Ticket, ArrowRightLeft, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  result: TrainSurfResult;
  onRunAgain: () => void;
}

export function ResultsDisplay({ result, onRunAgain }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = result.segments
      .map((s, i) => `${i + 1}. ${s.from} → ${s.to}: ${s.status}`)
      .join("\n");
    
    navigator.clipboard.writeText(
      `TrainSurf Results\n${result.seatChanges} seat change(s)\n\n${text}`
    );
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainsurf-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded!" });
  };

  if (!result.success) {
    return (
      <TicketCard variant="error" className="p-6 text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No Available Path Found
        </h3>
        <p className="text-muted-foreground mb-6">
          {result.error || "Could not find an available seat-stitching path for this journey."}
        </p>
        <Button onClick={onRunAgain} variant="gradient">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </TicketCard>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats Cards - Ticket Style */}
      <div className="grid grid-cols-3 gap-3">
        <TicketCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary">{result.segments.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Bookings</p>
        </TicketCard>
        <TicketCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
            <ArrowRightLeft className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-black text-accent">{result.seatChanges}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Changes</p>
        </TicketCard>
        <TicketCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-black text-success">{result.apiCalls}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">API Calls</p>
        </TicketCard>
      </div>

      {/* Success Banner - Ticket Style */}
      <TicketCard variant="success" className="overflow-visible">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-success text-lg">Optimal Journey Found!</p>
            <p className="text-sm text-success/80">
              {result.seatChanges === 0 
                ? "Direct booking available - no seat changes needed!"
                : `Only ${result.seatChanges} seat change${result.seatChanges > 1 ? 's' : ''} required`
              }
            </p>
          </div>
        </div>
      </TicketCard>

      {/* Journey Overview Ticket */}
      {result.segments.length > 0 && (
        <TicketCard>
          <JourneyHeader 
            trainNumber="Your Journey" 
            duration={`${result.segments.length} segment${result.segments.length > 1 ? 's' : ''}`}
          />
          <StationDisplay
            fromCode={result.segments[0].from}
            fromName="Origin"
            toCode={result.segments[result.segments.length - 1].to}
            toName="Destination"
          />
          <TicketFooter className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">
              Complete journey from {result.segments[0].from} to {result.segments[result.segments.length - 1].to}
            </span>
          </TicketFooter>
        </TicketCard>
      )}

      {/* Segments Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="font-bold text-foreground">Recommended Booking Plan</h3>
        </div>
        {result.segments.map((segment, index) => (
          <SegmentCard
            key={index}
            segment={segment}
            index={index}
            total={result.segments.length}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={downloadReport}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button
          variant="gradient"
          className="flex-1"
          onClick={onRunAgain}
        >
          <RefreshCw className="w-4 h-4" />
          New
        </Button>
      </div>
    </div>
  );
}
