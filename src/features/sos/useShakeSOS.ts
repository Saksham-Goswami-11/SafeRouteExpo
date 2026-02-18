import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.5; // Adjust this value based on testing
const SHAKE_TIMEOUT = 500; // Time in ms to detect shakes
const SHAKE_COUNT = 3; // Number of shakes required

/**
 * A custom hook to detect a "shake" gesture using the device's accelerometer.
 * When the shake gesture is detected and the feature is enabled, it invokes a callback.
 *
 * @param enabled - A boolean to enable or disable the shake detection.
 * @param onShake - The callback function to execute when a shake is detected.
 */
export const useShakeSOS = (enabled: boolean, onShake: () => void) => {
  useEffect(() => {
    if (!enabled) {
      // If not enabled, ensure no listener is active.
      Accelerometer.removeAllListeners();
      return;
    }

    let shakeCount = 0;
    let lastShakeTimestamp = 0;

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Calculate the magnitude of the acceleration vector.
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > SHAKE_THRESHOLD) {
        const now = Date.now();
        
        // Reset if shakes are too far apart.
        if (now - lastShakeTimestamp > SHAKE_TIMEOUT) {
          shakeCount = 1;
        } else {
          shakeCount++;
        }

        lastShakeTimestamp = now;

        if (shakeCount >= SHAKE_COUNT) {
          onShake(); // Trigger the callback.
          shakeCount = 0; // Reset after triggering.
        }
      }
    });

    // Cleanup function to remove the listener when the component unmounts or `enabled` changes.
    return () => subscription?.remove();
  }, [enabled, onShake]);
};