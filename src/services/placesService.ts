import { EXPO_PUBLIC_GOOGLE_PLACES_API_KEY } from '@env';

/**
 * This is your Google Cloud API Key.
 * IMPORTANT: Store this in a .env file and do not commit it to version control.
 * Create a file named .env in your project root and add:
 * EXPO_PUBLIC_GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
 */

const PLACES_API_ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby';

export interface Place {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchNearbyResponse {
  places: Place[];
}

/**
 * Searches for nearby places of a specific type (e.g., 'police', 'hospital') using the new Google Places API.
 * @param latitude - The user's current latitude.
 * @param longitude - The user's current longitude.
 * @param type - The type of place to search for ('police', 'hospital', etc.).
 * @param radius - The search radius in meters (e.g., 5000 for 5km).
 * @returns A promise that resolves to an array of places.
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  type: 'police' | 'hospital',
  radius: number = 5000
): Promise<Place[]> {
  if (!EXPO_PUBLIC_GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API Key is not configured.');
    throw new Error('API key is missing.');
  }

  const requestBody = {
    includedTypes: [type],
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
  };

  const response = await fetch(PLACES_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Places API Error:', errorData);
    throw new Error('Failed to fetch nearby places.');
  }

  const data: SearchNearbyResponse = await response.json();
  return data.places || [];
}