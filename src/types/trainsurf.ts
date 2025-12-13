// TrainSurf types and interfaces

export interface TrainSurfRequest {
  trainNo: string;
  source: string;
  destination: string;
  date: string;
  classType: string;
  quota: string;
}

export interface Segment {
  from: string;
  to: string;
  status: string;
  isAvailable: boolean;
}

export interface PathOption {
  segments: Segment[];
  seatChanges: number;
  type: 'direct' | 'hops' | 'wl_partial';
  description: string;
}

export interface TrainSurfResult {
  success: boolean;
  segments: Segment[];
  seatChanges: number;
  apiCalls: number;
  totalStations: number;
  error?: string;
  debugInfo?: string[];
  allPaths?: PathOption[];
  hasWLPath?: boolean;
  wlPath?: PathOption;
}

export interface HistoryEntry {
  id: string;
  trainNo: string;
  source: string;
  destination: string;
  date: string;
  classType: string;
  quota: string;
  seatChanges: number;
  success: boolean;
  timestamp: string;
  segments?: Segment[];
}

export const CLASS_OPTIONS = [
  { value: "1A", label: "First AC (1A)" },
  { value: "2A", label: "Second AC (2A)" },
  { value: "3A", label: "Third AC (3A)" },
  { value: "3E", label: "Third AC Economy (3E)" },
  { value: "SL", label: "Sleeper (SL)" },
  { value: "CC", label: "Chair Car (CC)" },
  { value: "EC", label: "Executive Chair (EC)" },
  { value: "2S", label: "Second Sitting (2S)" },
];

export const QUOTA_OPTIONS = [
  { value: "GN", label: "General (GN)" },
  { value: "TQ", label: "Tatkal (TQ)" },
  { value: "PT", label: "Premium Tatkal (PT)" },
  { value: "LD", label: "Ladies (LD)" },
  { value: "HP", label: "Physically Handicapped (HP)" },
  { value: "SS", label: "Senior Citizen (SS)" },
];