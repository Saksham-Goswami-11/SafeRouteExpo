import { analyzeRouteSegments, calculateOverallSafetyScore, SafetySegment } from './safetyAnalysis';

// IMPORTANT: Add your Google Maps API Key here
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// --- Interfaces for Route Analysis ---

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  coordinates: Coordinate[];
  safetySegments: SafetySegment[];
  safetyScore: number;
  duration: number; // in seconds
  distance: number; // in meters
  googleRoute: any; // Raw Google route object
}

interface AnalysisResult {
  safestRoute: RouteInfo;
  fastestRoute: RouteInfo;
  allRoutes: RouteInfo[];
}

// --- Polyline Decoder ---

/**
 * Decodes a Google Maps encoded polyline string into an array of coordinates.
 * @param encoded - The encoded polyline string.
 * @returns An array of [latitude, longitude] pairs.
 */
function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) {
    return [];
  }
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// --- Core Route Analysis Logic ---

/**
 * Fetches routes from Google Directions API and analyzes their safety.
 * @param startCoords - The starting coordinates.
 * @param endCoords - The destination coordinates.
 * @returns A promise that resolves to an object with the safest route, fastest route, and all routes.
 */
export async function analyzeAllRoutes(
  startCoords: Coordinate,
  endCoords: Coordinate
): Promise<AnalysisResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.");
  }

  const origin = `${startCoords.latitude},${startCoords.longitude}`;
  const destination = `${endCoords.latitude},${endCoords.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&alternatives=true`;

  console.log("Fetching routes from Google Directions API...");
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    console.error("Google Directions API Error:", data.error_message || data.status);
    throw new Error(`Failed to fetch routes from Google API: ${data.status}`);
  }

  console.log(`Received ${data.routes.length} routes from API. Analyzing...`);

  // Process each route in parallel
  const allRoutesPromises = data.routes.map(async (route: any): Promise<RouteInfo> => {
    const leg = route.legs[0];
    if (!leg) {
      // This should not happen with a valid route, but good to guard against it
      throw new Error("Invalid route structure: missing legs.");
    }

    // 1. Decode polyline to get route coordinates
    const decodedPoints = decodePolyline(route.overview_polyline.points);
    const coordinates = decodedPoints.map(([latitude, longitude]) => ({ latitude, longitude }));

    // 2. Analyze route for safety segments
    const safetySegments = analyzeRouteSegments(coordinates);

    // 3. Calculate overall safety score
    const safetyScore = calculateOverallSafetyScore(safetySegments);

    return {
      coordinates,
      safetySegments,
      safetyScore,
      duration: leg.duration.value, // seconds
      distance: leg.distance.value, // meters
      googleRoute: route,
    };
  });

  const allRoutes = await Promise.all(allRoutesPromises);

  if (allRoutes.length === 0) {
    throw new Error("No valid routes could be processed.");
  }

  // 4. Identify safest and fastest routes
  let safestRoute = allRoutes[0];
  let fastestRoute = allRoutes[0];

  for (const route of allRoutes) {
    if (route.safetyScore > safestRoute.safetyScore) {
      safestRoute = route;
    }
    if (route.duration < fastestRoute.duration) {
      fastestRoute = route;
    }
  }

  console.log(`Analysis complete. Safest score: ${safestRoute.safetyScore}, Fastest duration: ${fastestRoute.duration}s`);

  return {
    safestRoute,
    fastestRoute,
    allRoutes,
  };
}
