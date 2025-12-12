import { TrainSurfResult } from "@/types/trainsurf";
import { SegmentCard } from "./SegmentCard";
import { Button } from "./ui/button";
import { Copy, Download, RefreshCw, Check, AlertCircle } from "lucide-react";
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
      <div className="glass-card p-6 text-center animate-scale-in">
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
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{result.segments.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Bookings</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{result.seatChanges}</p>
          <p className="text-xs text-muted-foreground mt-1">Seat Changes</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{result.apiCalls}</p>
          <p className="text-xs text-muted-foreground mt-1">API Calls</p>
        </div>
      </div>

      {/* Success message */}
      <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="font-semibold text-success">Optimal Journey Found!</p>
          <p className="text-sm text-success/80">
            {result.seatChanges === 0 
              ? "Direct booking available - no seat changes needed!"
              : `Only ${result.seatChanges} seat change${result.seatChanges > 1 ? 's' : ''} required`
            }
          </p>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Recommended Booking Plan</h3>
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
          New Search
        </Button>
      </div>
    </div>
  );
}
