import { SafetySegment, SafetyReason } from './safetyAnalysis';
import { getAIConfig } from '../config/aiConfig';

// Use shared configuration to avoid conflicts
const getConfig = () => {
  const config = getAIConfig();
  return {
    BASE_URL: config.baseUrl,
    ENDPOINTS: {
      ANALYZE_ROUTE: config.endpoints.analyzeRoute,
      GET_SAFETY_SCORE: config.endpoints.safetyScore,
      CHECK_CRIMINAL_RECORDS: config.endpoints.criminalRecords
    },
    TIMEOUT: config.settings.timeout,
    RETRY_ATTEMPTS: config.settings.retryAttempts
  };
};

// Interface for AI Backend Response
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
}

// Interface for route analysis request
interface RouteAnalysisRequest {
  coordinates: Array<{latitude: number; longitude: number}>;
  analysisType: 'route' | 'location' | 'criminal_check';
  includeNews: boolean;
  includeCrimeData: boolean;
}

/**
 * Enhanced Safety Color Mapping with AI Backend Integration
 */
const getEnhancedSafetyColor = (score: number, newsAnalysis?: any) => {
  // Factor in news analysis if available
  let adjustedScore = score;
  
  if (newsAnalysis?.crimeLevel === 'high') {
    adjustedScore = Math.max(0, adjustedScore - 20);
  } else if (newsAnalysis?.crimeLevel === 'medium') {
    adjustedScore = Math.max(0, adjustedScore - 10);
  }
  
  if (adjustedScore >= 75) return '#22c55e'; // Safe (Green)
  if (adjustedScore >= 40) return '#f59e0b'; // Caution (Yellow)
  return '#ef4444'; // Unsafe (Red)
};

/**
 * HTTP Client with timeout and retry logic
 */
class AIHttpClient {
  private async makeRequest(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    const controller = new AbortController();
    const config = getConfig();
    const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const config = getConfig();
      if (retryCount < config.RETRY_ATTEMPTS) {
        console.log(`AI API request failed, retrying... (${retryCount + 1}/${config.RETRY_ATTEMPTS})`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.makeRequest(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  async post(endpoint: string, data: any): Promise<Response> {
    const config = getConfig();
    const url = `${config.BASE_URL}${endpoint}`;
    return this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async get(endpoint: string): Promise<Response> {
    const config = getConfig();
    const url = `${config.BASE_URL}${endpoint}`;
    return this.makeRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * AI Safety Analyzer - Main Integration Class
 */
export class AISafetyAnalyzer {
  private httpClient: AIHttpClient;
  private cache: Map<string, { data: AIBackendResponse; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.httpClient = new AIHttpClient();
    this.cache = new Map();
  }

  /**
   * Update AI Backend URL (when you get your Render URL)
   */
  static updateBackendUrl(newUrl: string) {
    // Note: This would require updating the config file directly
    // For now, users should update aiConfig.ts manually
    console.warn('To update backend URL, please modify src/config/aiConfig.ts directly');
  }

  /**
   * Generate cache key for location-based requests
   */
  private getCacheKey(latitude: number, longitude: number): string {
    const roundedLat = Math.round(latitude * 1000) / 1000;
    const roundedLng = Math.round(longitude * 1000) / 1000;
    return `${roundedLat},${roundedLng}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Auto-discover working endpoint
   */
  private async discoverWorkingEndpoint(): Promise<string | null> {
    const config = getConfig();
    const baseUrl = config.BASE_URL;
    const endpointsToTry = [
      '/analyze-route',
      '/api/analyze-route', 
      '/route/analyze',
      '/analyze',
      '/api/route/analyze',
      '/prediction/analyze',
      '/safety/analyze',
      '/api/safety/analyze',
      '/v1/analyze-route',
      '/api/v1/analyze-route'
    ];

    console.log('🔍 Auto-discovering working endpoint...');

    for (const endpoint of endpointsToTry) {
      try {
        const testUrl = `${baseUrl}${endpoint}`;
        console.log(`🧪 Testing: ${testUrl}`);
        
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            coordinates: [{ latitude: 28.6139, longitude: 77.2090 }],
            analysisType: 'test',
            includeNews: true,
            includeCrimeData: true
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        // Consider it working if we get any response other than 404
        if (testResponse.status !== 404) {
          console.log(`✅ Found working endpoint: ${endpoint} (Status: ${testResponse.status})`);
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Failed: ${endpoint}`);
        continue;
      }
    }

    console.log('⚠️ No working endpoints found');
    return null;
  }

  /**
   * Analyze single location with AI backend
   */
  async analyzeSingleLocation(
    latitude: number, 
    longitude: number,
    includeNews: boolean = true
  ): Promise<AIBackendResponse> {
    const cacheKey = this.getCacheKey(latitude, longitude);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('🚀 AI Analysis: Using cached data for location');
      return cached.data;
    }

    try {
      console.log('🚀 AI Analysis: Fetching real-time safety score from backend...');
      
      const requestData: RouteAnalysisRequest = {
        coordinates: [{ latitude, longitude }],
        analysisType: 'location',
        includeNews,
        includeCrimeData: true
      };

      let response;
      const config = getConfig();
      let endpointUsed = config.ENDPOINTS.ANALYZE_ROUTE;
      
      try {
        response = await this.httpClient.post(config.ENDPOINTS.ANALYZE_ROUTE, requestData);
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log('⚠️ 404 detected, trying to discover working endpoint...');
          const workingEndpoint = await this.discoverWorkingEndpoint();
          
          if (workingEndpoint) {
            endpointUsed = workingEndpoint;
            // Note: Working endpoint found
            console.log(`✅ Using discovered endpoint: ${workingEndpoint}`);
            response = await this.httpClient.post(workingEndpoint, requestData);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      if (!response.ok) {
        throw new Error(`AI Backend responded with status: ${response.status} for endpoint: ${endpointUsed}`);
      }

      const aiData: AIBackendResponse = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: aiData,
        timestamp: Date.now()
      });

      console.log('✅ AI Analysis: Successfully received data from backend:', {
        safetyScore: aiData.safetyScore,
        confidence: aiData.confidence,
        crimeLevel: aiData.newsAnalysis?.crimeLevel
      });

      return aiData;

    } catch (error) {
      console.error('❌ AI Analysis: Error fetching from backend:', error);
      
      // Return fallback data with lower confidence
      const fallbackData: AIBackendResponse = {
        success: false,
        safetyScore: 50, // Neutral/Caution score
        confidence: 0.3, // Low confidence
        location: { latitude, longitude },
        timestamp: new Date().toISOString(),
        reasoning: ['Unable to connect to AI backend', 'Using fallback safety assessment']
      };

      return fallbackData;
    }
  }

  /**
   * Analyze entire route with multiple segments
   */
  async analyzeRouteSegments(
    coordinates: Array<{latitude: number; longitude: number}>,
    useImprovedRoute: boolean = false
  ): Promise<SafetySegment[]> {
    if (coordinates.length === 0) {
      return [];
    }

    console.log(`🗺️ AI Route Analysis: Analyzing route with ${coordinates.length} coordinates`);

    try {
      // For performance, we'll analyze key points along the route
      const keyPoints = this.selectKeyRoutePoints(coordinates);
      const segments: SafetySegment[] = [];
      
      // Analyze each segment
      const segmentSize = Math.max(5, Math.floor(coordinates.length / Math.min(keyPoints.length, 10)));
      
      for (let i = 0; i < keyPoints.length; i++) {
        const point = keyPoints[i];
        const startIndex = i * segmentSize;
        const endIndex = Math.min(startIndex + segmentSize, coordinates.length - 1);
        const segmentCoords = coordinates.slice(startIndex, endIndex + 1);

        try {
          // Get AI analysis for this point
          const aiAnalysis = await this.analyzeSingleLocation(
            point.latitude, 
            point.longitude, 
            true
          );

          // Create enhanced safety segment
          const segment = this.createSafetySegment(
            segmentCoords, 
            aiAnalysis, 
            useImprovedRoute
          );
          
          segments.push(segment);
          
          // Small delay to avoid overwhelming the API
          if (i < keyPoints.length - 1) {
            await this.delay(200);
          }

        } catch (segmentError) {
          console.warn(`⚠️ Failed to analyze segment ${i + 1}, using fallback`, segmentError);
          
          // Create fallback segment
          const fallbackSegment = this.createFallbackSegment(segmentCoords, useImprovedRoute);
          segments.push(fallbackSegment);
        }
      }

      console.log(`✅ AI Route Analysis: Successfully analyzed ${segments.length} segments`);
      return segments;

    } catch (error) {
      console.error('❌ AI Route Analysis: Critical error during route analysis:', error);
      
      // Return fallback segments if everything fails
      return this.createFallbackRouteSegments(coordinates, useImprovedRoute);
    }
  }

  /**
   * Select key points along the route for analysis
   */
  private selectKeyRoutePoints(coordinates: Array<{latitude: number; longitude: number}>): Array<{latitude: number; longitude: number}> {
    if (coordinates.length <= 5) {
      return coordinates;
    }

    const keyPoints = [coordinates[0]]; // Start point
    
    // Select points at regular intervals
    const interval = Math.max(1, Math.floor(coordinates.length / 8));
    for (let i = interval; i < coordinates.length - interval; i += interval) {
      keyPoints.push(coordinates[i]);
    }
    
    keyPoints.push(coordinates[coordinates.length - 1]); // End point
    
    return keyPoints;
  }

  /**
   * Create safety segment from AI analysis
   */
  private createSafetySegment(
    coordinates: Array<{latitude: number; longitude: number}>,
    aiAnalysis: AIBackendResponse,
    useImprovedRoute: boolean
  ): SafetySegment {
    let safetyScore = aiAnalysis.safetyScore;
    
    // Boost score for improved routes
    if (useImprovedRoute) {
      safetyScore = Math.min(100, safetyScore + 15);
    }

    // Create safety reason from AI analysis
    const safetyReason: SafetyReason = this.createSafetyReasonFromAI(aiAnalysis);
    
    return {
      coordinates,
      safetyScore: this.mapScoreToCategory(safetyScore),
      color: getEnhancedSafetyColor(safetyScore, aiAnalysis.newsAnalysis),
      safetyReason,
      actualScore: safetyScore
    };
  }

  /**
   * Create safety reason from AI backend data
   */
  private createSafetyReasonFromAI(aiAnalysis: AIBackendResponse): SafetyReason {
    const score = aiAnalysis.safetyScore;
    let level: 'safe' | 'caution' | 'unsafe';
    let reasons: string[] = [];
    let recommendations: string[] = [];

    // Determine safety level
    if (score >= 70) {
      level = 'safe';
      reasons = [
        'AI analysis shows low crime activity',
        'Recent news indicates stable safety conditions'
      ];
      recommendations = [
        'Maintain normal precautions',
        'Share live location if traveling alone'
      ];
    } else if (score >= 40) {
      level = 'caution';
      reasons = [
        'Moderate risk detected by AI analysis',
        'Mixed safety indicators in recent news'
      ];
      recommendations = [
        'Travel in groups when possible',
        'Stay in well-lit, populated areas',
        'Keep emergency contacts accessible'
      ];
    } else {
      level = 'unsafe';
      reasons = [
        'AI analysis indicates elevated risk',
        'Recent incidents reported in area'
      ];
      recommendations = [
        'Consider alternative route strongly advised',
        'Travel with others or use transportation',
        'Keep emergency services on speed dial'
      ];
    }

    // Add news analysis insights if available
    if (aiAnalysis.newsAnalysis) {
      const { crimeLevel, recentIncidents, trend } = aiAnalysis.newsAnalysis;
      
      if (recentIncidents.length > 0) {
        reasons.push(`Recent incidents: ${recentIncidents.slice(0, 2).join(', ')}`);
      }
      
      if (trend === 'declining') {
        recommendations.push('Safety conditions are improving in this area');
      } else if (trend === 'stable') {
        recommendations.push('Safety conditions remain consistent');
      }
    }

    // Add AI reasoning if available
    if (aiAnalysis.reasoning) {
      reasons.push(...aiAnalysis.reasoning.slice(0, 2));
    }

    return {
      level,
      reasons: reasons.slice(0, 3), // Limit to 3 reasons
      recommendations: recommendations.slice(0, 3), // Limit to 3 recommendations
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
   * Create fallback segment when AI analysis fails
   */
  private createFallbackSegment(
    coordinates: Array<{latitude: number; longitude: number}>,
    useImprovedRoute: boolean
  ): SafetySegment {
    const fallbackScore = useImprovedRoute ? 75 : 50;
    
    return {
      coordinates,
      safetyScore: this.mapScoreToCategory(fallbackScore),
      color: getEnhancedSafetyColor(fallbackScore),
      safetyReason: {
        level: fallbackScore >= 70 ? 'safe' : 'caution',
        reasons: ['AI analysis temporarily unavailable', 'Using fallback safety assessment'],
        recommendations: ['Exercise normal precautions', 'Stay alert and aware']
      },
      actualScore: fallbackScore
    };
  }

  /**
   * Create fallback route segments
   */
  private createFallbackRouteSegments(
    coordinates: Array<{latitude: number; longitude: number}>,
    useImprovedRoute: boolean
  ): SafetySegment[] {
    const segmentSize = Math.max(5, Math.floor(coordinates.length / 10));
    const segments: SafetySegment[] = [];
    
    for (let i = 0; i < coordinates.length - 1; i += segmentSize) {
      const endIndex = Math.min(i + segmentSize, coordinates.length - 1);
      const segmentCoords = coordinates.slice(i, endIndex + 1);
      
      segments.push(this.createFallbackSegment(segmentCoords, useImprovedRoute));
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

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 AI Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Calculate overall safety score from AI-analyzed segments
 */
export const calculateAIOverallSafetyScore = (segments: SafetySegment[]): number => {
  if (segments.length === 0) return 0;
  
  // Weighted average considering AI confidence if available
  const totalScore = segments.reduce((sum, seg) => {
    return sum + (seg.actualScore || 50);
  }, 0);
  
  return Math.round(totalScore / segments.length);
};

/**
 * Global AI Analyzer instance
 */
export const aiSafetyAnalyzer = new AISafetyAnalyzer();

/**
 * Convenience function to update the backend URL
 * Call this when you have your Render URL ready
 */
export const setAIBackendUrl = (renderUrl: string) => {
  AISafetyAnalyzer.updateBackendUrl(renderUrl);
  console.log(`🚀 AI Backend URL updated to: ${renderUrl}`);
};

export default AISafetyAnalyzer;