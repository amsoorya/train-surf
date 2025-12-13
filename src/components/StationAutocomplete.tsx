import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface Station {
  code: string;
  name: string;
  state: string;
}

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id: string;
}

export function StationAutocomplete({ value, onChange, placeholder, id }: StationAutocompleteProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [filtered, setFiltered] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/stations.json")
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInputValue(val);
    onChange(val);

    if (val.length >= 1) {
      const matches = stations.filter(
        s => s.code.includes(val) || s.name.toUpperCase().includes(val)
      ).slice(0, 6);
      setFiltered(matches);
      setIsOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setIsOpen(false);
    }
  };

  const selectStation = (station: Station) => {
    setInputValue(station.code);
    onChange(station.code);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 1 && filtered.length > 0 && setIsOpen(true)}
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-elevated max-h-[200px] overflow-y-auto animate-scale-in">
          {filtered.map((station, idx) => (
            <button
              key={station.code}
              type="button"
              onClick={() => selectStation(station)}
              className={cn(
                "w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-accent/50 transition-colors",
                idx !== filtered.length - 1 && "border-b border-border/50"
              )}
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate">
                  {station.code} <span className="font-normal text-muted-foreground">- {station.name}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">{station.state}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
