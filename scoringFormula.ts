import { analyzeRouteSegments, calculateOverallSafetyScore } from "./src/utils/safetyAnalysis";

/**
 * Calculates a comprehensive safety score for a given route based on its coordinates.
 * This function analyzes the route's segments and then computes an overall score.
 * @param coordinates The array of coordinates representing the route.
 * @returns A promise that resolves to the overall safety score (0-100).
 */
export const calculateRouteScore = async (coordinates: Array<{ latitude: number; longitude: number }>): Promise<number> => {
  const segments = analyzeRouteSegments(coordinates);
  const overallScore = calculateOverallSafetyScore(segments);
  return overallScore;
};