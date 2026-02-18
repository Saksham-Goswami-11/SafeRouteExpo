// AI Prediction Service - Enhanced version with proper error handling
// Import shared config to avoid conflicts
import { getAIConfig } from '../config/aiConfig';

// Get URL from shared config
const getAnalyzeUrl = () => {
  const config = getAIConfig();
  return `${config.baseUrl}${config.endpoints.analyzeRoute}`;
};

// Interface for the expected response from your AI backend
interface AIResponse {
  success: boolean;
  safetyScore: number;
  confidence?: number;
  newsAnalysis?: {
    crimeLevel: 'low' | 'medium' | 'high';
    recentIncidents: string[];
    trend: 'improving' | 'stable' | 'declining';
  };
  location: {
    latitude: number;
    longitude: number;
  };
  reasoning?: string[];
}

// Function to determine safety color based on score
const getSafetyColor = (score: number): string => {
    if (score >= 75) return '#22c55e'; // Safe (Green)
    if (score >= 40) return '#f59e0b'; // Caution (Yellow)
    return '#ef4444'; // Unsafe (Red)
};

// Enhanced function to analyze route segments with AI
export async function analyzeRouteSegments(coordinates: any[]): Promise<any[]> {
  console.log("🚀 Fetching REAL safety score from live AI server...");

  try {
    // Validate input coordinates
    if (!coordinates || coordinates.length === 0) {
      throw new Error('No coordinates provided');
    }

    // Step 1: Send request to your live AI server
    const analyzeUrl = getAnalyzeUrl();
    console.log(`🎯 Using URL: ${analyzeUrl}`);
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        coordinates,
        analysisType: 'route',
        includeNews: true,
        includeCrimeData: true
      }), 
    });

    // Check if server response is successful
    if (!response.ok) {
        throw new Error(`AI Server responded with status: ${response.status}`);
    }

    // Step 2: Parse the response data
    const aiData: AIResponse = await response.json();
    console.log("✅ SUCCESS! Received data from AI server:", {
      score: aiData.safetyScore,
      confidence: aiData.confidence,
      crimeLevel: aiData.newsAnalysis?.crimeLevel
    });

    // Step 3: Return formatted results
    return [{ 
        safetyScore: aiData.safetyScore, 
        color: getSafetyColor(aiData.safetyScore),
        confidence: aiData.confidence || 0.8,
        newsAnalysis: aiData.newsAnalysis,
        reasoning: aiData.reasoning || ['AI analysis completed']
    }];

  } catch (error) {
    console.error("❌ ERROR fetching real safety score:", error);
    
    // Return fallback data with reasonable defaults
    return [{ 
      safetyScore: 50, 
      color: '#f59e0b', // Caution color
      confidence: 0.3, // Low confidence for fallback
      newsAnalysis: {
        crimeLevel: 'medium' as const,
        recentIncidents: [],
        trend: 'stable' as const
      },
      reasoning: ['AI analysis unavailable', 'Using fallback assessment']
    }];
  }
}

// Function to update the AI server URL
export function setAIServerUrl(newUrl: string): void {
  // Note: This won't work due to const, but shows the pattern
  // In production, use a configuration object
  console.log(`🔧 AI Server URL should be updated to: ${newUrl}`);
  console.log('Please update the AI_ANALYZER_URL constant directly');
}
