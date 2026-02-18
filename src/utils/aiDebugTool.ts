/**
 * AI Backend Debug Tool
 * Use this to test and debug your AI backend endpoints
 */

import { getAIConfig, getEndpointUrl } from '../config/aiConfig';

interface DebugResult {
  success: boolean;
  status: number;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Test if the backend base URL is accessible
 */
export async function testBackendHealth(): Promise<DebugResult> {
  const config = getAIConfig();
  
  try {
    console.log(`🧪 Testing backend health: ${config.baseUrl}`);
    
    const response = await fetch(config.baseUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Backend is accessible' : `Backend returned ${response.status}`,
      data: response.ok ? await response.text() : null
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      message: 'Cannot reach backend',
      error: error.message
    };
  }
}

/**
 * Test specific endpoint
 */
export async function testEndpoint(endpointName: string, method = 'GET', testData?: any): Promise<DebugResult> {
  const config = getAIConfig();
  
  try {
    // Handle different endpoint formats
    let endpoint = endpointName;
    if (endpointName === 'analyzeRoute') endpoint = '/analyze-route';
    if (endpointName === 'safetyScore') endpoint = '/safety-score';
    
    const url = `${config.baseUrl}${endpoint}`;
    console.log(`🧪 Testing endpoint: ${url}`);
    
    const options: RequestInit = {
      method,
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    if (method === 'POST' && testData) {
      options.body = JSON.stringify(testData);
    }
    
    const response = await fetch(url, options);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      message: `Endpoint ${endpoint} returned ${response.status}`,
      data: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      message: `Failed to test endpoint ${endpointName}`,
      error: error.message
    };
  }
}

/**
 * Test all common endpoint variations
 */
export async function testAllEndpoints(): Promise<{ [key: string]: DebugResult }> {
  const results: { [key: string]: DebugResult } = {};
  
  // Test common endpoint variations
  const endpointsToTest = [
    '/', // Root endpoint
    '/health', // Health check
    '/status', // Status check
    '/api', // API root
    '/analyze-route', // Your endpoint
    '/api/analyze-route', // With API prefix
    '/safety-score',
    '/api/safety-score'
  ];
  
  console.log('🧪 Testing all possible endpoints...');
  
  for (const endpoint of endpointsToTest) {
    results[endpoint] = await testEndpoint(endpoint, 'GET');
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Test POST request with sample data
 */
export async function testAnalyzeRouteEndpoint(): Promise<DebugResult> {
  const sampleData = {
    coordinates: [
      { latitude: 28.6139, longitude: 77.2090 },
      { latitude: 28.6150, longitude: 77.2100 }
    ],
    analysisType: 'route',
    includeNews: true,
    includeCrimeData: true
  };
  
  console.log('🧪 Testing analyze-route endpoint with sample data...');
  
  // Try different endpoint variations
  const variations = ['/analyze-route', '/api/analyze-route', '/route/analyze'];
  
  for (const endpoint of variations) {
    const result = await testEndpoint(endpoint, 'POST', sampleData);
    if (result.success) {
      return result;
    }
  }
  
  // If all fail, return the last attempt result
  return await testEndpoint('/analyze-route', 'POST', sampleData);
}

/**
 * Get backend information
 */
export async function getBackendInfo(): Promise<void> {
  const config = getAIConfig();
  
  console.log('🔍 AI Backend Debug Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Base URL: ${config.baseUrl}`);
  console.log(`📍 Analyze Route: ${config.baseUrl}${config.endpoints.analyzeRoute}`);
  console.log(`📊 Safety Score: ${config.baseUrl}${config.endpoints.safetyScore}`);
  console.log(`🚨 Criminal Records: ${config.baseUrl}${config.endpoints.criminalRecords}`);
  console.log(`📰 News Analysis: ${config.baseUrl}${config.endpoints.newsAnalysis}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Test backend health
  const healthResult = await testBackendHealth();
  console.log(`🏥 Backend Health: ${healthResult.success ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`📡 Status Code: ${healthResult.status}`);
  console.log(`💬 Message: ${healthResult.message}`);
  
  if (healthResult.error) {
    console.log(`❌ Error: ${healthResult.error}`);
  }
}

/**
 * Run comprehensive backend diagnostic
 */
export async function runFullDiagnostic(): Promise<void> {
  console.log('🚀 Starting comprehensive AI backend diagnostic...');
  console.log('');
  
  // Step 1: Basic info
  await getBackendInfo();
  console.log('');
  
  // Step 2: Test all endpoints
  console.log('🧪 Testing all possible endpoints...');
  const allResults = await testAllEndpoints();
  
  // Show results
  console.log('📊 Endpoint Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  Object.entries(allResults).forEach(([endpoint, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${endpoint} → ${result.status} (${result.message})`);
  });
  
  console.log('');
  
  // Step 3: Test POST request
  console.log('🧪 Testing POST request to analyze-route...');
  const postResult = await testAnalyzeRouteEndpoint();
  console.log(`POST Result: ${postResult.success ? '✅' : '❌'} ${postResult.message}`);
  
  if (postResult.data) {
    console.log('📄 Response Data:', postResult.data);
  }
  
  console.log('');
  console.log('🎯 Diagnostic complete!');
  
  // Recommendations
  const workingEndpoints = Object.entries(allResults).filter(([_, result]) => result.success);
  
  if (workingEndpoints.length > 0) {
    console.log('✅ Found working endpoints:');
    workingEndpoints.forEach(([endpoint, result]) => {
      console.log(`   ${endpoint} (Status: ${result.status})`);
    });
  } else {
    console.log('❌ No working endpoints found. Possible issues:');
    console.log('   1. Backend server is down or not deployed');
    console.log('   2. URL is incorrect');
    console.log('   3. CORS issues');
    console.log('   4. Different endpoint structure than expected');
  }
}

/**
 * Quick fix suggestions
 */
export function getFixSuggestions(): void {
  console.log('🔧 Quick Fix Suggestions:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. 📡 Check if your backend is running:');
  console.log('   Visit: https://amba-analyzer-backend.onrender.com');
  console.log('');
  console.log('2. 🔍 Common endpoint variations to try:');
  console.log('   /api/analyze-route');
  console.log('   /route/analyze');
  console.log('   /analyze');
  console.log('');
  console.log('3. 🛠️ Update your backend to support these endpoints:');
  console.log('   POST /analyze-route');
  console.log('   GET  /health (for health checks)');
  console.log('');
  console.log('4. 📝 Expected request format:');
  console.log(`   {
     "coordinates": [
       {"latitude": 28.6139, "longitude": 77.2090}
     ],
     "analysisType": "route",
     "includeNews": true,
     "includeCrimeData": true
   }`);
  console.log('');
  console.log('5. 📤 Expected response format:');
  console.log(`   {
     "success": true,
     "safetyScore": 75,
     "confidence": 0.85,
     "newsAnalysis": {
       "crimeLevel": "low",
       "recentIncidents": [],
       "trend": "stable"
     }
   }`);
}

export default {
  testBackendHealth,
  testEndpoint,
  testAllEndpoints,
  testAnalyzeRouteEndpoint,
  getBackendInfo,
  runFullDiagnostic,
  getFixSuggestions
};