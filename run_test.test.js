// Import the function to test
const { analyzeAreaSafetyFromNews } = require('./src/utils/newsSafetyAnalyzer.ts');

// --- Test Configuration ---
const TEST_LOCATION = {
  // A location in Mumbai, India
  latitude: 19.0760,
  longitude: 72.8777,
};
const TEST_RADIUS_KM = 5; // 5 km radius

// --- Jest Test Runner ---
// Humne 'async function runTest()' ko 'test(...)' se badal diya hai
// '10000' ka matlab hai test ko 10 seconds tak chalaayein (API call ke liye zaroori)
test('should analyze area safety from news', async () => {
  console.log(`--- Running Safety Analysis Test ---`);
  console.log(`Analyzing area around: Latitude ${TEST_LOCATION.latitude}, Longitude ${TEST_LOCATION.longitude}`);
  console.log(`Radius: ${TEST_RADIUS_KM} km`);
  console.log('------------------------------------');

  const result = await analyzeAreaSafetyFromNews(
    TEST_LOCATION.latitude,
    TEST_LOCATION.longitude,
    TEST_RADIUS_KM
  );

  console.log('\n--- Analysis Result ---');
  console.log(result); // Poora result object print karein
  
  // Asli test yeh check karega ki result sahi hai ya nahi
  expect(result.safetyScore).toBeGreaterThanOrEqual(0);
  expect(result.safetyScore).toBeLessThanOrEqual(100);

}, 10000); // 10 second timeout