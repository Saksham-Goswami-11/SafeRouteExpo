import * as Location from 'expo-location';

// TODO: Replace with the actual News API key provided by the user.
const NEWS_API_KEY = '60706cdeaac74dca869332a63aaec31a';
const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface SafetyAnalysisResult {
  safetyScore: number;
  contributingHeadlines: string[];
}

const KEYWORD_RISKS: { [key: string]: number } = {
  robbery: 30,
  theft: 20,
  assault: 30,
  kidnapping: 40,
  murder: 50,
  homicide: 50,
  shooting: 40,
  protest: 15,
  riot: 25,
  accident: 10,
  crash: 10,
  fire: 15,
  scam: 5,
  burglary: 20,
};

/**
 * Calculates the distance between two coordinates in kilometers.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Fetches news articles for a given city.
 * @param city The city to fetch news for.
 * @returns A promise that resolves to an array of news articles.
 */
async function fetchNewsForCity(city: string): Promise<NewsArticle[]> {
  if (NEWS_API_KEY === '60706cdeaac74dca869332a63aaec31a') {
    console.warn('News API key is not set. Using mock data.');
    // Return mock data for now
    return [
      {
        title: 'Robbery on Mumbai Expressway near a popular shop',
        description: 'A robbery was reported on the Mumbai Expressway earlier today.',
        content: 'The incident took place near the famous "Gupta Shop" on the Mumbai Expressway, causing traffic delays.',
        url: 'https://example.com/news1',
        publishedAt: new Date().toISOString(),
        source: { name: 'Mock News' },
      },
      {
        title: 'Protests in downtown area',
        description: 'Peaceful protests are being held in the downtown area.',
        content: 'Protesters have gathered near the city square.',
        url: 'https://example.com/news2',
        publishedAt: new Date().toISOString(),
        source: { name: 'Mock News' },
      },
    ];
  }

  try {
    const response = await fetch(`${NEWS_API_ENDPOINT}?q=${encodeURIComponent(city)}&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.articles || [];
    } else {
      console.error('Error fetching news:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

/**
 * Extracts potential location names from a text.
 * This is a simplified implementation and may not be very accurate.
 * @param text The text to extract locations from.
 * @returns An array of potential location names.
 */
function extractLocationsFromText(text: string): string[] {
  const locationPatterns = [
    /near\s+([A-Z][\w\s]+)/g,
    /on\s+([A-Z][\w\s]+)/g,
    /at\s+([A-Z][\w\s]+)/g,
  ];

  const locations: string[] = [];
  for (const pattern of locationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) { 
      locations.push(match[1].trim());
    }
  }
  return locations;
}

/**
 * Analyzes the safety of a given area based on news trends.
 * @param latitude The latitude of the area to analyze.
 * @param longitude The longitude of the area to analyze.
 * @param radiusInKm The radius to consider for the analysis in kilometers.
 * @returns A promise that resolves to a SafetyAnalysisResult.
 */
export async function analyzeAreaSafetyFromNews(
  latitude: number,
  longitude: number,
  radiusInKm: number = 1
): Promise<SafetyAnalysisResult> {
  let safetyScore = 100;
  const contributingHeadlines: string[] = [];

  try {
    // 1. Reverse geocode to get the city name
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!Array.isArray(addresses) || addresses.length === 0 || !addresses[0].city) {
      console.warn("Could not find city for the given coordinates.");
      return { safetyScore: 100, contributingHeadlines: [] }; // Safe if no city found
    }
    const city = addresses[0].city;

    // 2. Fetch news for the city
    const articles = await fetchNewsForCity(city);

    // 3. Analyze each article
    for (const article of articles) {
      const textToAnalyze = `${article.title}. ${article.description}. ${article.content}`;
      const lowerCaseText = textToAnalyze.toLowerCase();

      // Check for keywords
      let articleRisk = 0;
      for (const keyword in KEYWORD_RISKS) {
        if (lowerCaseText.includes(keyword)) {
          articleRisk += KEYWORD_RISKS[keyword];

          // Extract specific locations from the text
          const potentialLocations = extractLocationsFromText(article.content);
          for (const locName of potentialLocations) {
            try {
              const geocodedLocations = await Location.geocodeAsync(locName);
              for (const geoLoc of geocodedLocations) {
                const distance = getDistanceInKm(latitude, longitude, geoLoc.latitude, geoLoc.longitude);
                if (distance <= radiusInKm) {
                  // This news is relevant to the area
                  safetyScore -= articleRisk;
                  if (!contributingHeadlines.includes(article.title)) {
                    contributingHeadlines.push(article.title);
                  }
                  // Reset risk to avoid double counting for the same article
                  articleRisk = 0;
                  break;
                }
              }
            } catch (e) {
              // Geocoding failed for this location name, ignore
            }
            if (articleRisk === 0) break;
          }
        }
      }
    }

    // Ensure safety score is not below 0
    if (safetyScore < 0) {
      safetyScore = 0;
    }

    if (contributingHeadlines.length === 0) {
      return { safetyScore: 100, contributingHeadlines: ["Area is safe"] };
    }

    return { safetyScore, contributingHeadlines };
  } catch (error) {
    console.error('Error analyzing area safety:', error);
    return { safetyScore: 100, contributingHeadlines: ["Error analyzing safety"] };
  }
}
