/**
 * This file declares the types for the environment variables.
 * It allows TypeScript to recognize variables imported from '@env'.
 */
declare module '@env' {
  export const EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: string;
  export const EXPO_PUBLIC_GOOGLE_GEOCODING_API_KEY: string;
  export const GNEWS_API_KEY: string;
}