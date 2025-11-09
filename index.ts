import { Alert } from "react-native";
import { AnalyzedRoute, GoogleRoute } from "./types";
import { calculateRouteScore } from "./scoringFormula";
import { aiSafetyAnalyzer, SafetySegment } from "../../utils/aiSafetyAnalyzer";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Decodes Google's encoded polyline strings into an array of coordinates.
 */
const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
  if (!encoded) return [];
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

/**
 * Fetches multiple routes from Google and analyzes each for safety.
 * @param startCoords The starting coordinates.
 * @param endCoords The destination coordinates.
 * @returns An object containing the recommended safest route and all alternatives.
 */
export const analyzeAllRoutes = async (
  startCoords: { latitude: number; longitude: number },
  endCoords: { latitude: number; longitude: number }
) => {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${endCoords.latitude},${endCoords.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&alternatives=true`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    Alert.alert('No Routes Found', 'Could not find any routes between the selected locations.');
    throw new Error('No routes found');
  }

  // Concurrently analyze all routes returned by Google
  const analysisPromises = data.routes.map(async (route: GoogleRoute, index: number): Promise<AnalyzedRoute> => {
    const coordinates = decodePolyline(route.overview_polyline.points);
    
    // Get the comprehensive safety score
    const safetyScore = await calculateRouteScore(coordinates);

    // Also get the detailed segments for drawing on the map
    // We can run this in parallel with the main score calculation
    const safetySegments = await aiSafetyAnalyzer.analyzeRouteSegments(coordinates, index > 0);

    return {
      id: `route-${index}`,
      googleRoute: route,
      coordinates,
      safetyScore,
      safetySegments,
      duration: route.legs[0].duration.value,
      distance: route.legs[0].distance.value,
    };
  });

  const analyzedRoutes = await Promise.all(analysisPromises);

  if (analyzedRoutes.length === 0) {
    throw new Error('Route analysis failed');
  }

  // Sort routes by safety score, descending (highest score is best)
  analyzedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

  const safestRoute = analyzedRoutes[0];
  const fastestRoute = analyzedRoutes.reduce((fastest, current) => 
    current.duration < fastest.duration ? current : fastest
  );

  return {
    safestRoute,
    fastestRoute,
    allRoutes: analyzedRoutes,
  };
};