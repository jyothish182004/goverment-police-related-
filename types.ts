
export type IncidentStatus = 'Needs Review' | 'Confirmed' | 'False Alarm' | 'Resolved';

export type IncidentType = 
  | 'Vehicle Collision' 
  | 'Person Fall' 
  | 'Thief / Robbery' 
  | 'Women Safety' 
  | 'Weapon / Violence'
  | 'Sudden Motion Spike' 
  | 'Proximity Warning';

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  timestamp: string;
  location: string;
  confidence: number;
  videoRef: string;
  snapshotUrl: string;
  description: string;
  detectedObjects: string[];
}

export interface DashboardStats {
  totalIncidents: number;
  pendingReview: number;
  confirmedToday: number;
  avgResponseTime: string;
}

export enum NavigationTab {
  Dashboard = 'dashboard',
  LiveFeed = 'live',
  Incidents = 'incidents',
  Upload = 'upload',
  Analytics = 'analytics'
}
