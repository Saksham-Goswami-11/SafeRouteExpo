import { SafetySegment } from "./src/utils/safetyAnalysis";

export interface GoogleRoute {
  overview_polyline: {
    points: string;
  };
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    steps: any[]; // You can define a more specific type for steps if needed
  }>;
  summary: string;
}

export interface AnalyzedRoute {
  id: string;
  googleRoute: GoogleRoute;
  coordinates: Array<{ latitude: number; longitude: number }>;
  safetyScore: number;
  safetySegments: SafetySegment[];
  duration: number;
  distance: number;
}