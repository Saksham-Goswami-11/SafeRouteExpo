/**
 * AI Backend Configuration
 * Update this file with your actual Render URL once deployed
 */

export interface AIConfig {
  baseUrl: string;
  endpoints: {
    analyzeRoute: string;
    safetyScore: string;
    criminalRecords: string;
    newsAnalysis: string;
  };
  settings: {
    timeout: number;
    retryAttempts: number;
    cacheTime: number;
    enableCaching: boolean;
    enableFallback: boolean;
  };
}

// 🔧 UPDATE THIS WITH YOUR ACTUAL RENDER URL
const AI_CONFIG: AIConfig = {
  baseUrl: "http://YOUR_COMPUTER_IP:5000", // 👈 TEMPORARY CHANGE FOR LOCAL TESTING
  
  endpoints: {
    analyzeRoute: "/api/analyze-route", // 👈 Try this first - common pattern
    safetyScore: "/api/safety-score", 
    criminalRecords: "/api/criminal-records",
    newsAnalysis: "/api/news-analysis"
  },
  
  settings: {
    timeout: 15000, // 15 seconds
    retryAttempts: 3,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enableCaching: true,
    enableFallback: true
  }
};

/**
 * Update the AI backend URL
 */
export function updateAIConfig(newBaseUrl: string): void {
  AI_CONFIG.baseUrl = newBaseUrl;
  console.log(`🚀 AI Backend URL updated to: ${newBaseUrl}`);
}

/**
 * Get current AI configuration
 */
export function getAIConfig(): AIConfig {
  return AI_CONFIG;
}

/**
 * Check if AI backend is properly configured
 */
export function isAIConfigured(): boolean {
  return AI_CONFIG.baseUrl !== "https://your-render-url.onrender.com" && 
         AI_CONFIG.baseUrl.includes('render.com');
}

/**
 * Get full endpoint URL
 */
export function getEndpointUrl(endpoint: keyof AIConfig['endpoints']): string {
  return `${AI_CONFIG.baseUrl}${AI_CONFIG.endpoints[endpoint]}`;
}

/**
 * Development/Testing Mode Configuration
 * Set this to true during development to use mock data
 */
export const DEVELOPMENT_MODE = {
  enabled: true, // 👈 ENABLED - to use AI analysis logic
  mockDelay: 2000, // 2 seconds delay to simulate network
  mockSafetyScore: 75, // Default mock safety score
  mockConfidence: 0.85, // Default mock confidence
  mockCrimeLevel: 'low' as const,
  // Debug settings
  enableAutoDiscovery: true, // Automatically find working endpoints
  enableDetailedLogging: true // Show detailed debug logs
};

/**
 * Easy setup function - call this when you get your Render URL
 */
export function setupAIBackend(renderUrl: string): void {
  if (!renderUrl || !renderUrl.includes('render.com')) {
    console.warn('⚠️ Invalid Render URL provided');
    return;
  }
  
  updateAIConfig(renderUrl);
  
  // Test configuration
  console.log('🧪 AI Backend Configuration:');
  console.log(`   Base URL: ${AI_CONFIG.baseUrl}`);
  console.log(`   Analyze Route: ${getEndpointUrl('analyzeRoute')}`);
  console.log(`   Safety Score: ${getEndpointUrl('safetyScore')}`);
  console.log(`   Criminal Records: ${getEndpointUrl('criminalRecords')}`);
  console.log(`   News Analysis: ${getEndpointUrl('newsAnalysis')}`);
  console.log('✅ AI Backend ready for integration!');
}

export default AI_CONFIG;