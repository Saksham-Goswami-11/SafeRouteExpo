import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/DeviceSensor';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { fetchContacts } from '../../services/contactsService';

// Define the EmergencyContact type here, as it's used by fetchContacts
interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
}

const SHAKE_THRESHOLD = 1.8; // How hard the shake should be
const SHAKE_COUNT = 3; // How many shakes are needed
const SHAKE_TIMEFRAME = 1000; // Milliseconds timeframe for the shakes

/**
 * Custom hook to detect a shake gesture and trigger an SOS action.
 * @param enabled - Boolean to enable or disable the shake detection.
 */
export const useShakeSOS = (enabled: boolean) => {
  const { user } = useAuth();
  const subscription = useRef<Subscription | null>(null);
  const [shakeData, setShakeData] = useState<{ count: number; lastShake: number }>({
    count: 0,
    lastShake: 0,
  });

  useEffect(() => {
    if (enabled) {
      _subscribe();
    } else {
      _unsubscribe();
    }

    // Cleanup on unmount
    return () => _unsubscribe();
  }, [enabled]);

  const _subscribe = () => {
    // Set update interval for the accelerometer
    Accelerometer.setUpdateInterval(100); // 10 times per second

    const sub = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const totalForce = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

      if (totalForce > SHAKE_THRESHOLD) {
        setShakeData(currentShakeData => {
          const now = Date.now();
          const { count, lastShake } = currentShakeData;
          
          // If last shake was too long ago, reset the counter
          if (now - lastShake > SHAKE_TIMEFRAME) {
            return { count: 1, lastShake: now };
          }
          
          const newCount = count + 1;
          
          // If shake count is met, trigger SOS and reset
          if (newCount >= SHAKE_COUNT) {
            triggerSOS();
            return { count: 0, lastShake: 0 };
          }
          
          return { count: newCount, lastShake: now };
        });
      }
    });
    subscription.current = sub;
  };

  const _unsubscribe = () => {
    subscription.current?.remove();
    subscription.current = null;
  };

  const triggerSOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to send SOS.');
        return;
      }

      // --- LIVE LOCATION UPDATE ---
      // Always fetch a fresh, high-accuracy location when SOS is triggered.
      // This ensures the most up-to-date position is sent.
      console.log("Fetching live location for SOS...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const message = `SOS! I need help. My current location is: https://maps.google.com/?q=${latitude},${longitude}`;

      if (!user) {
        // Fallback for users who are not logged in
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        await Linking.openURL(whatsappUrl);
        return;
      }

      // Fetch emergency contacts from the database
      const contacts = await fetchContacts(user.id);
      if (contacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Please add emergency contacts in your profile to use the SOS feature.',
          [{ text: 'Open Profile', onPress: () => { /* TODO: Navigate to profile */ } }, { text: 'Cancel' }]
        );
        return;
      }

      // Open WhatsApp for each contact
      for (const contact of contacts) {
        // --- RELIABILITY FIX ---
        // Sanitize the phone number: remove all non-digit characters.
        // This is crucial for the WhatsApp deep link to work correctly.
        let sanitizedPhone = contact.phone.replace(/\D/g, '');

        // --- NEW RELIABILITY FIX ---
        // WhatsApp requires a country code. Let's assume '91' for India if the number is 10 digits.
        // Adjust the country code and length check as needed for your target audience.
        if (sanitizedPhone.length === 10) {
          sanitizedPhone = `91${sanitizedPhone}`;
        }
        // --- END NEW FIX ---

        // --- FINAL RELIABILITY FIX ---
        // Use the more reliable 'https://wa.me/' link format.
        // This is the official and more robust way to deep link into WhatsApp.
        const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);

        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          // This provides a more specific error if WhatsApp isn't installed or the link is invalid.
          Alert.alert('Error', `Could not open WhatsApp for contact ${contact.name}. Please ensure WhatsApp is installed and the phone number is correct.`);
        }
        // Add a small delay between opening each chat
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      Alert.alert('SOS Failed', `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
};