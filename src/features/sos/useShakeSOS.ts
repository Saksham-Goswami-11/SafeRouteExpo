import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { fetchContacts } from '../../services/contactsService';
import { useAuth } from '../../context/AuthContext';

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function formatMapsLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function formatMessage(name: string, lat: number, lng: number, address?: string) {
  const link = formatMapsLink(lat, lng);
  const ts = new Date().toLocaleString();
  const addr = address ? `\nAddress: ${address}` : '';
  return `Dear ${name} i need help i am in trouble... this is my live location: ${link}${addr}\nTime: ${ts}`;
}

async function openWhatsApp(phone: string, text: string) {
  const url = `whatsapp://send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) return Linking.openURL(url);
  // Fallback to wa.me
  return Linking.openURL(`https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`);
}

export function useShakeSOS(enabled: boolean) {
  const { user } = useAuth();
  const lastTimes = useRef<number[]>([]);
  const threshold = 1.4; // g
  const windowMs = 1000; // as requested

  useEffect(() => {
    if (!enabled) return;
    let sub: any;

    const start = async () => {
      try {
        sub = Accelerometer.addListener(async ({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          if (magnitude > threshold) {
            const now = Date.now();
            lastTimes.current.push(now);
            // keep only last second
            lastTimes.current = lastTimes.current.filter(t => now - t <= windowMs);
            if (lastTimes.current.length >= 3) {
              // trigger and reset buffer - Now requires 3 hard shakes instead of 2
              lastTimes.current = [];
              try {
                const perm = await Location.getForegroundPermissionsAsync();
                if (!perm.granted) {
                  const req = await Location.requestForegroundPermissionsAsync();
                  if (!req.granted) return;
                }
                const loc = await Location.getCurrentPositionAsync({});
                let addressText = '';
                try {
                  const rg = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                  if (rg && rg[0]) {
                    const a = rg[0];
                    addressText = [a.name, a.street, a.city, a.region, a.postalCode].filter(Boolean).join(', ');
                  }
                } catch {}

                if (!user) {
                  Alert.alert('SOS', 'Please log in to use SOS feature.');
                  return;
                }
                const contacts = await fetchContacts(user.id);
                if (!contacts.length) {
                  Alert.alert('SOS', 'No emergency contacts saved.');
                  return;
                }

                Alert.alert('Sending SOS', `Preparing WhatsApp messages to ${contacts.length} contact(s).`);

                for (const c of contacts) {
                  const text = formatMessage(c.name, loc.coords.latitude, loc.coords.longitude, addressText);
                  await openWhatsApp(c.phone, text);
                  await sleep(1500); // small delay before next open
                }
              } catch (e) {
                console.warn('SOS error', e);
              }
            }
          }
        });
        Accelerometer.setUpdateInterval(100); // 10 Hz
      } catch (e) {
        console.warn('Accelerometer error', e);
      }
    };

    start();
    return () => { sub && sub.remove && sub.remove(); };
  }, [enabled, user?.id]);
}
