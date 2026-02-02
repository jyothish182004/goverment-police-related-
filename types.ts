
export type IncidentType = 
  | 'Vehicle Collision' 
  | 'Person Fall' 
  | 'Thief / Robbery' 
  | 'Women Safety' 
  | 'Weapon / Violence'
  | 'Suspicious Behavior'
  | 'Traffic Congestion';

// Added AuditCheck and VerificationAudit interfaces to fix import errors in geminiService.ts
export interface AuditCheck {
  status: 'VALID' | 'FAILED' | 'SUSPICIOUS';
  details: string;
}

export interface VerificationAudit {
  locationCheck: AuditCheck;
  metadataCheck: AuditCheck;
  neuralCheck: AuditCheck;
  overallScore: number;
}

export interface IdentifiedSubject {
  name: string;
  id: string;
  status: 'Clear' | 'Flagged' | 'Wanted' | 'Unknown';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  bio: string;
  matchConfidence: number;
  faults?: string[]; 
  mugshotUrl?: string;
  mugshotBase64?: string; 
}

export interface Incident {
  id: string;
  type: IncidentType;
  timestamp: string; 
  savedAt?: string; 
  location: string;
  locationCoords?: { lat: number, lng: number };
  confidence: number;
  videoRef: string;
  snapshotUrl: string;
  description: string;
  detectedObjects: string[];
  localVideoUrl?: string; 
  identifiedSubject?: IdentifiedSubject;
  licensePlate?: string; 
}

export type TransportMode = 'Car' | 'Ambulance';

export enum NavigationTab {
  Upload = 'upload',
  CriminalID = 'criminal_id',
  Archive = 'archive',
  TacticalMap = 'tactical_map'
}
