import { SafetySegment, SafetyReason } from './safetyAnalysis';
import { searchNearbyPlaces } from '../services/placesService';

// Interface for AI Backend Response (Updated for Transparency)
interface AIBackendResponse {
  success: boolean;
  safetyScore: number;
  confidence: number;
  newsAnalysis?: {
    crimeLevel: 'low' | 'medium' | 'high';
    recentIncidents: string[];
    trend: 'improving' | 'stable' | 'declining';
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  reasoning?: string[];
  // NEW: detailed factors
  safetyFactors: {
    police: { name: string, distance: string, location: { latitude: number, longitude: number } } | null;
    hospital: { name: string, distance: string, location: { latitude: number, longitude: number } } | null;
    lighting: string;
  };
}

/**
 * Enhanced Safety Color Mapping
 */
const getEnhancedSafetyColor = (score: number) => {
  if (score >= 75) return '#22c55e'; // Safe (Green)
  if (score >= 40) return '#f59e0b'; // Caution (Yellow)
  return '#ef4444'; // Unsafe (Red)
};

/**
 * AI Safety Analyzer - Local Intelligence Implementation
 */
export class AISafetyAnalyzer {

  /**
   * Analyze single location using local heuristics
   */
  async analyzeSingleLocation(
    latitude: number,
    longitude: number,
    includeNews: boolean = true
  ): Promise<AIBackendResponse> {

    // 1. Time of Day Factor
    const hour = new Date().getHours();
    let timeScore = 100;
    let timeReason = '';
    let lightingStatus = 'Good';

    if (hour >= 22 || hour <= 5) {
      timeScore = 40; // High risk at night
      timeReason = 'Late night hours - High Caution';
      lightingStatus = 'Limited (Night)';
    } else if (hour >= 19 || hour <= 21) {
      timeScore = 70; // Moderate risk evening
      timeReason = 'Evening hours - Moderate Caution';
      lightingStatus = 'Moderate (Evening)';
    } else {
      timeScore = 95; // Day time safe
      timeReason = 'Daylight hours - Generally Safe';
      lightingStatus = 'Good (Daylight)';
    }

    // 2. Proximity to Safety Services (Police/Hospitals)
    let placesScore = 0;
    let placesReason = '';
    let nearbySafePlaces: string[] = [];

    // Safety Intel Objects
    let nearestPolice = null;
    let nearestHospital = null;

    try {
      // Check for police stations within 2km
      const policeStations = await searchNearbyPlaces(latitude, longitude, 'police', 3000); // 3km radius
      if (policeStations.length > 0) {
        placesScore += 20;
        const p = policeStations[0];
        nearestPolice = {
          name: p.displayName?.text || 'Local Police Station',
          distance: p.distance ? `${p.distance.toFixed(1)} km` : 'Nearby',
          location: p.location
        };
        nearbySafePlaces.push('Police Station nearby');
      }

      // Check for hospitals within 2km
      const hospitals = await searchNearbyPlaces(latitude, longitude, 'hospital', 3000);
      if (hospitals.length > 0) {
        placesScore += 10;
        const h = hospitals[0];
        nearestHospital = {
          name: h.displayName?.text || 'Medical Center',
          distance: h.distance ? `${h.distance.toFixed(1)} km` : 'Nearby',
          location: h.location
        };
        nearbySafePlaces.push('Hospital nearby');
      }

      if (nearbySafePlaces.length > 0) {
        placesReason = `Proximity to help: ${nearbySafePlaces.join(', ')}`;
      }
    } catch (e) {
      console.log('Could not fetch nearby places for safety analysis', e);
    }

    // 3. Calculate Final Score
    // Base score is heavily weighted by time, boosted by safe places
    let finalScore = timeScore + placesScore;
    finalScore = Math.min(100, Math.max(0, finalScore)); // Clamp between 0-100

    const reasoning = [timeReason];
    if (placesReason) reasoning.push(placesReason);

    return {
      success: true,
      safetyScore: finalScore,
      confidence: 0.8,
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
      reasoning: reasoning,
      safetyFactors: {
        police: nearestPolice,
        hospital: nearestHospital,
        lighting: lightingStatus
      }
    };
  }

  /**
   * Analyze entire route with multiple segments
   */
  async analyzeRouteSegments(
    coordinates: Array<{ latitude: number; longitude: number }>,
    useImprovedRoute: boolean = false
  ): Promise<SafetySegment[]> {
    if (coordinates.length === 0) {
      return [];
    }

    console.log(`🗺️ Local Safety Analysis: Analyzing route with ${coordinates.length} coordinates`);

    try {
      // For performance, we'll analyze key points along the route
      const keyPoints = this.selectKeyRoutePoints(coordinates);
      const segments: SafetySegment[] = [];

      // Analyze each segment
      const segmentSize = Math.max(5, Math.floor(coordinates.length / Math.min(keyPoints.length, 5)));

      for (let i = 0; i < keyPoints.length; i++) {
        const point = keyPoints[i];
        const startIndex = i * segmentSize;
        const endIndex = Math.min(startIndex + segmentSize, coordinates.length - 1);
        const segmentCoords = coordinates.slice(startIndex, endIndex + 1);

        // Get analysis for this point
        const analysis = await this.analyzeSingleLocation(
          point.latitude,
          point.longitude,
          true
        );

        // Create enhanced safety segment
        const segment = this.createSafetySegment(
          segmentCoords,
          analysis,
          useImprovedRoute
        );

        segments.push(segment);
      }

      console.log(`✅ Local Safety Analysis: Successfully analyzed ${segments.length} segments`);
      return segments;

    } catch (error) {
      console.error('❌ Local Safety Analysis: Critical error:', error);
      return this.createFallbackRouteSegments(coordinates, useImprovedRoute);
    }
  }

  /**
   * Select key points along the route for analysis
   */
  private selectKeyRoutePoints(coordinates: Array<{ latitude: number; longitude: number }>): Array<{ latitude: number; longitude: number }> {
    if (coordinates.length <= 5) {
      return coordinates;
    }

    const keyPoints = [coordinates[0]]; // Start point

    // Select fewer points to save API calls (Google Places is not free/unlimited)
    // Just check start, middle, and end
    const midIndex = Math.floor(coordinates.length / 2);
    keyPoints.push(coordinates[midIndex]);

    keyPoints.push(coordinates[coordinates.length - 1]); // End point

    return keyPoints;
  }

  /**
   * Create safety segment from analysis
   */
  private createSafetySegment(
    coordinates: Array<{ latitude: number; longitude: number }>,
    aiAnalysis: AIBackendResponse,
    useImprovedRoute: boolean
  ): SafetySegment {
    let safetyScore = aiAnalysis.safetyScore;

    // Boost score for improved routes (simulating a "safer" alternative)
    if (useImprovedRoute) {
      safetyScore = Math.min(100, safetyScore + 10);
    }

    // Create safety reason
    const safetyReason: SafetyReason = this.createSafetyReason(aiAnalysis);

    return {
      coordinates,
      safetyScore: this.mapScoreToCategory(safetyScore),
      color: getEnhancedSafetyColor(safetyScore),
      safetyReason,
      actualScore: safetyScore,
      // Pass the details through
      safetyFactors: aiAnalysis.safetyFactors
    };
  }

  /**
   * Create safety reason from data
   */
  private createSafetyReason(analysis: AIBackendResponse): SafetyReason {
    const score = analysis.safetyScore;
    let level: 'safe' | 'caution' | 'unsafe';
    let recommendations: string[] = [];

    // Determine safety level
    if (score >= 70) {
      level = 'safe';
      recommendations = ['Route appears safe based on local data'];
    } else if (score >= 40) {
      level = 'caution';
      recommendations = ['Stay alert, especially at night'];
    } else {
      level = 'unsafe';
      recommendations = ['Consider alternative transport', 'Share live location'];
    }

    return {
      level,
      reasons: analysis.reasoning || [],
      recommendations: recommendations,
      timeOfDay: this.getTimeOfDayMessage()
    };
  }

  /**
   * Map numerical score to category (1-3)
   */
  private mapScoreToCategory(score: number): number {
    if (score >= 70) return 3; // Safe
    if (score >= 40) return 2; // Caution
    return 1; // Unsafe
  }

  /**
   * Create fallback route segments
   */
  private createFallbackRouteSegments(
    coordinates: Array<{ latitude: number; longitude: number }>,
    useImprovedRoute: boolean
  ): SafetySegment[] {
    const segmentSize = Math.max(5, Math.floor(coordinates.length / 10));
    const segments: SafetySegment[] = [];

    for (let i = 0; i < coordinates.length - 1; i += segmentSize) {
      const endIndex = Math.min(i + segmentSize, coordinates.length - 1);
      const segmentCoords = coordinates.slice(i, endIndex + 1);

      segments.push({
        coordinates: segmentCoords,
        safetyScore: 2,
        color: '#f59e0b',
        safetyReason: {
          level: 'caution',
          reasons: ['Analysis unavailable'],
          recommendations: ['Stay alert']
        },
        actualScore: 50,
        safetyFactors: { police: null, hospital: null, lighting: 'Unknown' }
      });
    }

    return segments;
  }

  /**
   * Get time-based safety message
   */
  private getTimeOfDayMessage(): string | undefined {
    const hour = new Date().getHours();

    if (hour >= 20 || hour <= 6) {
      return 'Night time - Extra caution advised';
    } else if (hour >= 6 && hour <= 9) {
      return 'Morning rush hour - Busy period';
    } else if (hour >= 17 && hour <= 19) {
      return 'Evening rush hour - High activity';
    }

    return undefined;
  }
}

/**
 * Calculate overall safety score from segments
 */
export const calculateAIOverallSafetyScore = (segments: SafetySegment[]): number => {
  if (segments.length === 0) return 0;

  const totalScore = segments.reduce((sum, seg) => {
    return sum + (seg.actualScore || 50);
  }, 0);

  return Math.round(totalScore / segments.length);
};

/**
 * Global AI Analyzer instance
 */
export const aiSafetyAnalyzer = new AISafetyAnalyzer();

export default AISafetyAnalyzer;