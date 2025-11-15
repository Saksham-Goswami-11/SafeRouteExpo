import { getCrimeDataForCoordinate, getNewsForLocation, analyzeNewsSentiment } from '../services/api';

const CRIME_WEIGHT = 0.6;
const NEWS_WEIGHT = 0.4;

// Define a simple type for a route point for better type safety.
interface RoutePoint {
  latitude: number;
  longitude: number;
}

/**
 * Analyzes the safety score for a single coordinate.
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns A promise that resolves to a safety score (0-100).
 */
export async function analyzeSingleRoute(lat: number, lon: number): Promise<number> {
  try {
    // Fetch crime and news data in parallel for better performance.
    const [crimeDataResult, newsArticlesResult] = await Promise.allSettled([
      getCrimeDataForCoordinate(lat, lon),
      getNewsForLocation(lat, lon),
    ]);

    // Calculate Crime Score
    let crimeScore = 50; // Default to a neutral score
    if (crimeDataResult.status === 'fulfilled' && crimeDataResult.value) {
      const crimeCount = crimeDataResult.value.crime_count || 0;
      crimeScore = Math.max(0, 100 - crimeCount * 10); // Example scoring
    } else if (crimeDataResult.status === 'rejected') {
      console.error("Failed to fetch crime data:", crimeDataResult.reason);
    }

    // Calculate News Score
    let totalSentiment = 0;
    let newsScore = 50; // Default to a neutral score
    if (newsArticlesResult.status === 'fulfilled' && newsArticlesResult.value && newsArticlesResult.value.length > 0) {
      // Handle individual sentiment analysis errors gracefully.
      const sentimentResults = await Promise.allSettled(
        newsArticlesResult.value.map((article: any) => analyzeNewsSentiment(article.title))
      );
      
      const validScores = sentimentResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<number>).value);

      if (validScores.length > 0) {
        totalSentiment = validScores.reduce((acc, score) => acc + score, 0) / validScores.length;
      }
    } else if (newsArticlesResult.status === 'rejected') {
      console.error("Failed to fetch news data:", newsArticlesResult.reason);
    }
    // Convert sentiment (-1 to 1) to a safety score (0 to 100)
    newsScore = (totalSentiment + 1) * 50;

    // Combine scores
    const finalScore = (crimeScore * CRIME_WEIGHT) + (newsScore * NEWS_WEIGHT);
    return Math.round(Math.max(0, Math.min(100, finalScore)));
  } catch (error) {
    console.error('Error analyzing route:', error);
    return 50; // Return a neutral score on error
  }
}

export async function analyzeAllRoutes(routes: RoutePoint[]): Promise<number[]> {
    const results = await Promise.allSettled(
        routes.map(route => analyzeSingleRoute(route.latitude, route.longitude))
    );

    return results.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error("Failed to analyze a route point:", result.reason);
            return 50; // Return a neutral score for the failed point
        }
    });
}