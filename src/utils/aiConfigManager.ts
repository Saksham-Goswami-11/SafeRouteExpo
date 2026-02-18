/**
 * Unified AI Configuration Manager
 * This resolves all conflicts between different AI config files
 */

export interface UnifiedAIConfig {
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
  };
}

// SINGLE SOURCE OF TRUTH - UPDATE ONLY THIS
const UNIFIED_CONFIG: UnifiedAIConfig = {
  baseUrl: "https://amba-analyzer-backend.onrender.com", 
  endpoints: {
    analyzeRoute: "/api/analyze-route", // Try this first
    safetyScore: "/api/safety-score",
    criminalRecords: "/api/criminal-records", 
    newsAnalysis: "/api/news-analysis"
  },
  settings: {
    timeout: 15000,
    retryAttempts: 3,
    cacheTime: 5 * 60 * 1000
  }
};

// Alternative endpoints to try if primary fails
export const ALTERNATIVE_ENDPOINTS = [
  "/analyze-route",      // Original endpoint
  "/api/analyze-route",  // API prefixed 
  "/route/analyze",      // Different pattern
  "/analyze",            // Short version
  "/prediction/analyze", // Prediction pattern
  "/safety/analyze"      // Safety pattern
];

/**
 * Get the unified configuration
 */
export function getUnifiedConfig(): UnifiedAIConfig {
  return UNIFIED_CONFIG;
}

/**
 * Get full URL for any endpoint
 */
export function getEndpointUrl(endpoint: keyof UnifiedAIConfig['endpoints']): string {
  return `${UNIFIED_CONFIG.baseUrl}${UNIFIED_CONFIG.endpoints[endpoint]}`;
}

/**
 * Update the base URL (for when you get your actual Render URL)
 */
export function updateBaseUrl(newUrl: string): void {
  UNIFIED_CONFIG.baseUrl = newUrl;
  console.log(`🚀 Unified Config: Base URL updated to ${newUrl}`);
  logCurrentConfig();
}

/**
 * Update a specific endpoint
 */
export function updateEndpoint(
  endpoint: keyof UnifiedAIConfig['endpoints'], 
  newPath: string
): void {
  UNIFIED_CONFIG.endpoints[endpoint] = newPath;
  console.log(`🔧 Unified Config: ${endpoint} updated to ${newPath}`);
}

/**
 * Test and auto-discover working endpoints
 */
export async function discoverWorkingEndpoints(): Promise<{
  working: string[];
  failed: string[];
}> {
  console.log('🔍 Auto-discovering working endpoints...');
  
  const working: string[] = [];
  const failed: string[] = [];
  
  const testData = {
    coordinates: [{ latitude: 28.6139, longitude: 77.2090 }],
    analysisType: 'test',
    includeNews: true,
    includeCrimeData: true
  };
  
  for (const endpoint of ALTERNATIVE_ENDPOINTS) {
    try {
      const url = `${UNIFIED_CONFIG.baseUrl}${endpoint}`;
      console.log(`🧪 Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status !== 404) {
        working.push(endpoint);
        console.log(`✅ Working: ${endpoint} (${response.status})`);
      } else {
        failed.push(endpoint);
        console.log(`❌ Failed: ${endpoint} (404)`);
      }
    } catch (error) {
      failed.push(endpoint);
      console.log(`❌ Error: ${endpoint} - ${error}`);
    }
    
    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (working.length > 0) {
    console.log(`🎉 Found ${working.length} working endpoint(s)!`);
    // Auto-update to use the first working endpoint
    updateEndpoint('analyzeRoute', working[0]);
    console.log(`🔄 Auto-updated analyzeRoute to: ${working[0]}`);
  }
  
  return { working, failed };
}

/**
 * Get current configuration status
 */
export function getConfigStatus(): {
  configured: boolean;
  baseUrl: string;
  endpoints: string[];
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check base URL
  if (UNIFIED_CONFIG.baseUrl.includes('your-render-url')) {
    issues.push('Base URL not updated from placeholder');
  }
  
  if (!UNIFIED_CONFIG.baseUrl.includes('render.com')) {
    issues.push('Base URL does not appear to be a Render URL');
  }
  
  // Check endpoints
  const endpoints = Object.entries(UNIFIED_CONFIG.endpoints).map(
    ([key, path]) => `${key}: ${UNIFIED_CONFIG.baseUrl}${path}`
  );
  
  return {
    configured: issues.length === 0,
    baseUrl: UNIFIED_CONFIG.baseUrl,
    endpoints,
    issues
  };
}

/**
 * Log current configuration for debugging
 */
export function logCurrentConfig(): void {
  console.log('🔍 Current Unified AI Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Base URL: ${UNIFIED_CONFIG.baseUrl}`);
  console.log('📍 Endpoints:');
  Object.entries(UNIFIED_CONFIG.endpoints).forEach(([key, path]) => {
    console.log(`   ${key}: ${UNIFIED_CONFIG.baseUrl}${path}`);
  });
  console.log('⚙️ Settings:');
  console.log(`   Timeout: ${UNIFIED_CONFIG.settings.timeout}ms`);
  console.log(`   Retry Attempts: ${UNIFIED_CONFIG.settings.retryAttempts}`);
  console.log(`   Cache Time: ${UNIFIED_CONFIG.settings.cacheTime / 1000}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const status = getConfigStatus();
  if (status.issues.length > 0) {
    console.log('⚠️ Configuration Issues:');
    status.issues.forEach(issue => console.log(`   • ${issue}`));
  } else {
    console.log('✅ Configuration looks good!');
  }
}

/**
 * Quick setup function - call this with your Render URL
 */
export function quickSetup(renderUrl: string): void {
  console.log(`🚀 Quick Setup: Configuring AI backend...`);
  
  // Clean the URL
  const cleanUrl = renderUrl.replace(/\/$/, ''); // Remove trailing slash
  
  updateBaseUrl(cleanUrl);
  
  // Test the configuration
  console.log('🧪 Testing configuration...');
  discoverWorkingEndpoints().then(result => {
    if (result.working.length > 0) {
      console.log('🎉 Setup successful! Found working endpoints.');
    } else {
      console.log('⚠️ Setup completed but no working endpoints found.');
      console.log('   Please check if your backend is running.');
    }
  });
}

// Auto-log configuration on import (for debugging)
logCurrentConfig();

export default {
  getUnifiedConfig,
  getEndpointUrl,
  updateBaseUrl,
  updateEndpoint,
  discoverWorkingEndpoints,
  getConfigStatus,
  logCurrentConfig,
  quickSetup
};