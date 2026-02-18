/**
 * Quick Backend Debug Script
 * Run this in your browser console or as a standalone script
 */

async function debugBackend() {
  const baseUrl = 'https://amba-analyzer-backend.onrender.com';
  
  console.log('🔍 Starting backend debug...');
  console.log(`Base URL: ${baseUrl}`);
  
  // Test endpoints to try
  const endpoints = [
    '/',
    '/health',
    '/status',
    '/api',
    '/analyze-route',
    '/api/analyze-route',
    '/route/analyze',
    '/analyze',
    '/api/route/analyze',
    '/prediction/analyze',
    '/safety/analyze'
  ];
  
  const sampleData = {
    coordinates: [
      { latitude: 28.6139, longitude: 77.2090 },
      { latitude: 28.6150, longitude: 77.2100 }
    ],
    analysisType: 'route',
    includeNews: true,
    includeCrimeData: true
  };
  
  console.log('\n📊 Testing GET requests...');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`✅ GET ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        try {
          const data = await response.text();
          console.log(`   Response: ${data.substring(0, 100)}...`);
        } catch (e) {
          console.log(`   Response: [Unable to parse]`);
        }
      }
    } catch (error) {
      console.log(`❌ GET ${endpoint}: ${error.message}`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n📤 Testing POST requests...');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(sampleData)
      });
      
      console.log(`✅ POST ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status < 500) { // Any response except server error
        try {
          const data = await response.text();
          console.log(`   Response: ${data.substring(0, 100)}...`);
        } catch (e) {
          console.log(`   Response: [Unable to parse]`);
        }
      }
    } catch (error) {
      console.log(`❌ POST ${endpoint}: ${error.message}`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n🎯 Debug complete!');
  console.log('\n💡 Look for endpoints that returned 200, 201, or even 400 status codes.');
  console.log('   404 means the endpoint doesn\'t exist');
  console.log('   400 might mean the endpoint exists but didn\'t like our data format');
  console.log('   500 means there\'s a server error but the endpoint exists');
}

// Run the debug
debugBackend();