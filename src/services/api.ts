// Access environment variables directly from process.env
const { EXPO_PUBLIC_GOOGLE_PLACES_API_KEY, EXPO_PUBLIC_GNEWS_API_KEY } = process.env;

const NEWS_API_KEY = EXPO_PUBLIC_GNEWS_API_KEY; // Use environment variable
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const SENTIMENT_API_URL = 'https://language.googleapis.com/v1/documents:analyzeSentiment';

/**
 * Fetches crime data for a specific coordinate.
 * This is a mock function. Replace with a real API call.
 */
export const getCrimeDataForCoordinate = async (lat: number, lon: number) => {
  console.log(`Fetching crime data for ${lat}, ${lon}`);
  // Mock response
  return Promise.resolve({ crime_count: Math.floor(Math.random() * 20) });
};

/**
 * Fetches news articles for a specific location.
 */
export const getNewsForLocation = async (lat: number, lon: number) => {
  try {
    // In a real app, you might use reverse geocoding to get a city name first.
    // For now, we'll use a generic query.
    const query = "crime OR safety";

    if (!NEWS_API_KEY || NEWS_API_KEY === 'YOUR_GNEWS_API_KEY_HERE') {
      console.warn('News API key is not configured in .env. Returning empty array.');
      return [];
    }

    const url = `${NEWS_API_URL}?q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&pageSize=5`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

/**
 * Analyzes the sentiment of a given text using Google's NLP API.
 */
export const analyzeNewsSentiment = async (text: string): Promise<number> => {
  // A real implementation would look like this.
  // For now, we'll keep it as a mock to avoid making real API calls during testing.
  if (process.env.NODE_ENV !== 'production') {
    const mockSentiment = Math.random() - 0.5; // Random number between -0.5 and 0.5
    console.log(`[MOCK] Analyzed sentiment for "${text.substring(0, 20)}...": ${mockSentiment.toFixed(2)}`);
    return Promise.resolve(mockSentiment);
  }

  // Real API call to Google Cloud Natural Language API
  try {
    const url = `${SENTIMENT_API_URL}?key=${EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: { content: text, type: 'PLAIN_TEXT' },
        encodingType: 'UTF8',
      }),
    });
    const data = await response.json();
    return data.documentSentiment.score; // Returns a value between -1.0 and 1.0
  } catch (error) {
    console.error('Error analyzing real sentiment:', error);
    return 0; // Return neutral on error
  }
};