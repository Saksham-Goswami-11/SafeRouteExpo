export enum RiskLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  DANGER = 'DANGER'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  rating: number; // 0-5
  verified: boolean;
  distance: number; // meters
  status: 'IDLE' | 'RESPONDING' | 'OFFLINE';
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isTrusted: boolean;
  avatar?: string;
}

export interface IncidentReport {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  location: string;
  riskLevel: RiskLevel;
  aiAnalysis?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface EvidenceItem {
  id: string;
  type: 'AUDIO' | 'VIDEO' | 'LOCATION_LOG';
  timestamp: string;
  hash: string; // SHA-256 simulation
  verifiedOnBlockchain: boolean;
}