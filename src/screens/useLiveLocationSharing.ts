import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { getAIConfig } from '../config/aiConfig';
import { LocationSubscription } from 'expo-location';

const LOCATION_TRACKING_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 5000, // 5 seconds
  distanceInterval: 10, // 10 meters
};
// This is the expected response from your backend when starting a session
interface LiveShareSession {
  sessionId: string;
  shareUrl: string;
}

/**
 * Custom hook to manage live location sharing sessions.
 */
export const useLiveLocationSharing = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [session, setSession] = useState<LiveShareSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locationSubscription = useRef<LocationSubscription | null>(null);

  /**
   * Starts a new live location sharing session.
   * This function will eventually call our backend to create a session.
   */
  const startSharing = useCallback(async () => {
    setError(null);
    // First, request foreground permissions.
    let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Foreground location permission is required to start sharing.');
      setError('Foreground permission denied.');
      return;
    }

    setIsSharing(true);

    try {
      // --- BACKEND INTEGRATION ---
      console.log('Starting live share session with backend...');
      const config = getAIConfig();
      // NOTE: Your Python backend needs an endpoint like '/api/session/start'
      const response = await fetch(`${config.baseUrl}/api/session/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Backend server could not start a session.');
      }

      const newSession: LiveShareSession = await response.json();
      setSession(newSession);
      // --- END BACKEND INTEGRATION ---

      // Start watching the position
      locationSubscription.current = await Location.watchPositionAsync(
        LOCATION_TRACKING_OPTIONS,
        (newLocation) => {
          console.log('New location update:', newLocation.coords);
          // --- SEND UPDATE TO BACKEND ---
          // NOTE: Your Python backend needs an endpoint like '/api/session/update'
          fetch(`${config.baseUrl}/api/session/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: newSession.sessionId,
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            }),
          }).catch(e => console.error("Failed to send location update:", e));
          // --- END SEND UPDATE ---
        }
      );

      return newSession;
    } catch (e) {
      console.error('Failed to start sharing session:', e);
      setError('Could not start sharing session.');
      setIsSharing(false);
      return null;
    }
  }, []);

  /**
   * Stops the current live location sharing session.
   */
  const stopSharing = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsSharing(false);
    setSession(null);
    console.log('Live sharing stopped.');
    // --- NOTIFY BACKEND (Optional but good practice) ---
    if (session) {
      const config = getAIConfig();
      fetch(`${config.baseUrl}/api/session/stop`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.sessionId }),
      }).catch(e => console.error("Failed to notify backend of session stop:", e));
    }
  }, []);

  return { isSharing, session, error, startSharing, stopSharing };
};