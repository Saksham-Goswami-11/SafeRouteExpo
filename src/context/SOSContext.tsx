import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useRef, useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { fetchContacts } from '../services/contactsService';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import * as SMS from 'expo-sms';
import * as sqlite from '../services/sqlite';
import { startRecording, stopRecording } from '../services/audioRecorder';
import { Audio } from 'expo-av';
import * as Battery from 'expo-battery';

export interface SOSContextType {
  shakeEnabled: boolean;
  setShakeEnabled: (enabled: boolean) => void;
  isConfirmingSOS: boolean;
  isSOSActive: boolean; // New: is the emergency mode actually running?
  noContactsModalVisible: boolean;
  startSOSConfirmation: () => void;
  cancelSOSConfirmation: () => void;
  confirmSOS: () => void;
  stopSOS: () => void;
  sendSOSAlert: () => void;
  closeNoContactsModal: () => void;
  openWhatsApp: () => void;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [isConfirmingSOS, setIsConfirmingSOS] = useState(false);
  const [noContactsModalVisible, setNoContactsModalVisible] = useState(false);

  // Real-Time Tracking State
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);

  // Ref to hold the location subscription
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Audio Recording Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const startSOSConfirmation = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to use this feature.');
      return;
    }
    // Prevent starting if already confirming, active, or no contacts modal showing
    if (isConfirmingSOS || isSOSActive || noContactsModalVisible) return;

    try {
      const contacts = await fetchContacts(user.id);
      if (contacts && contacts.length > 0) {
        setIsConfirmingSOS(true);
      } else {
        setNoContactsModalVisible(true);
      }
    } catch (error: any) {
      console.error('Failed to fetch contacts for SOS:', error);
      Alert.alert('Error', 'Could not verify emergency contacts. Please try again.');
    }
  }, [isConfirmingSOS, isSOSActive, noContactsModalVisible, user]);

  const cancelSOSConfirmation = useCallback(() => setIsConfirmingSOS(false), []);

  const confirmSOS = useCallback(async () => {
    setIsConfirmingSOS(false);

    if (!user) {
      // Fallback if somehow user is null but we got here
      sendSOSAlert();
      return;
    }

    try {
      // --- 1. GPS Pre-Check ---
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("GPS Disabled", "Please enable GPS/Location Services to use SOS Tracking.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required for SOS.");
        return;
      }

      console.log('🚨 SOS CONFIRMED - STARTING LIVE TRACKING 🚨');
      setIsSOSActive(true);

      // --- START AUDIO RECORDING ---
      console.log("🎙️ DEBUG: Starting Audio Recorder...");
      const recording = await startRecording();
      recordingRef.current = recording;

      // Auto-stop recording after 1 minute
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

      autoStopTimerRef.current = setTimeout(async () => {
        console.log("⏳ Auto-stopping audio recording (1 min limit)...");
        const uri = await stopRecording(recordingRef.current);
        recordingRef.current = null;
        if (uri) {
          await sqlite.saveAudioLog({
            id: Date.now().toString(),
            uri,
            timestamp: Date.now(),
            duration: '60s (Auto)'
          });
          console.log("🎙️ Evidence Saved Locally (Auto-Stop)");
        }
      }, 60000); // 60 seconds
      // -----------------------------

      // --- 2. Firestore Setup ---
      const alertDocId = user.id;
      setAlertId(alertDocId);
      const alertRef = doc(db, 'active_alerts', alertDocId);

      // --- 3. Initial Location ---
      // Changed to Balanced accuracy to be faster/lighter if High is struggling indoors
      // But keeping High as per original req unless changed. User instructions: "Use Accuracy.Balanced (or High)"
      // Let's stick to High but with timeout logic if needed? 
      // Actually instructions say: "Use accuracy: Location.Accuracy.Balanced (or High) but add a timeInterval: 5000"
      // Use accuracy: Location.Accuracy.Balanced (or High) but add a timeInterval: 5000"
      const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const initialBattery = await Battery.getBatteryLevelAsync();
      const initialSpeed = initialLocation.coords.speed ?? 0;

      await setDoc(alertRef, {
        status: 'ACTIVE',
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName || 'Unknown',
        timestamp: serverTimestamp(),
        startedAt: Date.now(),
        coordinates: {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          heading: initialLocation.coords.heading,
          speed: initialSpeed,
        },
        battery: initialBattery ?? -1,
        speed: initialSpeed,
        lastUpdated: serverTimestamp()
      });

      // --- 4. Start Real-Time Watcher ---
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000    // Or every 5 seconds (prevent overload)
        },
        async (newLoc) => {
          try {
            const batteryLevel = await Battery.getBatteryLevelAsync();
            const safeBattery = batteryLevel ?? -1;
            const safeSpeed = newLoc.coords.speed ?? 0;

            console.log("📡 Telemetry Update -> Bat:", safeBattery, "Speed:", safeSpeed);

            await updateDoc(alertRef, {
              coordinates: {
                latitude: newLoc.coords.latitude,
                longitude: newLoc.coords.longitude,
                heading: newLoc.coords.heading,
                speed: safeSpeed
              },
              battery: safeBattery,
              speed: safeSpeed,
              lastUpdated: serverTimestamp()
            });
            console.log("🔥 FIRESTORE WRITE SUCCESS - Battery:", safeBattery);
            console.log('📍 Location updated to Firestore');
          } catch (err) {
            console.log('Error updating location trace:', err);
          }
        }
      );

      // --- INSERTED SMS LOGIC ---
      try {
        // 1. Fetch Contacts from SQLite
        const savedContacts = await sqlite.getEmergencyContacts(user.id);
        console.log("📋 DEBUG: Contacts Found:", savedContacts.length);

        // 2. Prepare Message
        const uid = auth.currentUser?.uid;
        const trackingLink = uid ? `https://amba-safety.web.app/?id=${uid}` : `http://maps.google.com`;
        const message = `🚨 HELP! I am in danger. Track me here: ${trackingLink}`;

        // 3. Check SMS Availability
        const isSMSAvailable = await SMS.isAvailableAsync();

        if (isSMSAvailable && savedContacts.length > 0) {
          // Priority: Send SMS to saved contacts
          const phoneNumbers = savedContacts.map(c => c.phone);
          console.log("✅ Opening SMS for:", phoneNumbers);
          const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
          console.log("SMS Result:", result);
        } else {
          // Fallback: WhatsApp (if no contacts or no SMS)
          console.log("⚠️ Fallback to WhatsApp");
          await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
        }
      } catch (err) {
        console.error("SOS Logic Error:", err);
        // Last Resort Fallback
        Linking.openURL(`whatsapp://send?text=HELP`);
      }
      // ---------------------------

    } catch (error: any) {
      console.error("SOS Tracking Error:", error);
      Alert.alert("Tracking Error", error.message || "Unknown error occurred.");
      setIsSOSActive(false);
      // Optional: Fallback to basic if needed, but error handling is explicit now
    }

  }, [user]);

  const stopSOS = useCallback(async () => {
    if (!alertId || !user) return;

    try {
      // 1. Stop Watcher
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      // Stop Audio Recording if active
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }

      if (recordingRef.current) {
        const uri = await stopRecording(recordingRef.current);
        recordingRef.current = null;
        if (uri) {
          await sqlite.saveAudioLog({
            id: Date.now().toString(),
            uri,
            timestamp: Date.now(),
            duration: 'Manual Stop'
          });
          console.log("🎙️ Evidence Saved Locally");
        }
      }

      // 2. Update Firestore Status
      const alertRef = doc(db, 'active_alerts', alertId);
      await updateDoc(alertRef, {
        status: 'RESOLVED',
        resolvedAt: serverTimestamp()
      });

      // 3. Reset State
      setIsSOSActive(false);
      setAlertId(null);
      Alert.alert("SOS Ended", "Live tracking has been stopped.");

    } catch (error) {
      console.error("Error stopping SOS:", error);
      // Force reset local state even if server update fails
      setIsSOSActive(false);
    }
  }, [alertId, user]);

  const closeNoContactsModal = useCallback(() => setNoContactsModalVisible(false), []);

  const sendSOSAlert = useCallback(async () => {
    console.log("🚀 STARTING SOS ALERT PROCESS...");

    try {
      // 1. Get Fresh Contacts directly from DB (Don't trust State)
      const uid = auth.currentUser?.uid;
      // User snippet had no args, but our sqlite function needs uid.
      const savedContacts = uid ? await sqlite.getEmergencyContacts(uid) : [];
      console.log("📋 Found Contacts in DB:", savedContacts.length);

      // 2. Get Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Error", "Location permission needed for SOS.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 3. Generate Link
      const trackingLink = uid
        ? `https://amba-safety.web.app/?id=${uid}`
        : `http://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;

      // Debug Log for Visibility
      console.log("\n🔗 ---------------------------------------------------");
      console.log("🔗 GENERATED SOS LINK:", trackingLink);
      console.log("🔗 ---------------------------------------------------\n");

      const message = `🚨 EMERGENCY! I need help.\n\nMy live location is being tracked here:\n${trackingLink}`;

      // 4. DECISION TIME: SMS vs WhatsApp
      const isSMSAvailable = await SMS.isAvailableAsync();

      if (isSMSAvailable && savedContacts.length > 0) {
        // --- PATH A: SMS BLAST ---
        console.log("✅ Sending via SMS to:", savedContacts.map(c => c.phone));
        const phoneNumbers = savedContacts.map(c => c.phone);

        const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
        console.log("SMS Result:", result);

      } else {
        // --- PATH B: WHATSAPP FALLBACK ---
        console.log("⚠️ SMS Unavailable or No Contacts. Falling back to WhatsApp.");
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
      }

    } catch (error) {
      console.error("❌ SOS Error:", error);
      Alert.alert("Error", "Failed to send alert.");
    }
  }, []);

  const openWhatsApp = useCallback(async () => {
    console.log("🟢 Opening WhatsApp SOS...");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Error", "Location permission needed for SOS.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const uid = auth.currentUser?.uid;

      const trackingLink = uid
        ? `https://amba-safety.web.app/?id=${uid}`
        : `http://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;

      const message = `🚨 EMERGENCY! I need help.\n\nMy live location is being tracked here:\n${trackingLink}`;

      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);

    } catch (error) {
      console.error("❌ WhatsApp SOS Error:", error);
      Linking.openURL(`whatsapp://send?text=HELP`);
    }
  }, []);

  const value = useMemo(() => ({
    shakeEnabled,
    setShakeEnabled,
    isConfirmingSOS,
    isSOSActive,
    noContactsModalVisible,
    startSOSConfirmation,
    cancelSOSConfirmation,
    confirmSOS,
    stopSOS,
    sendSOSAlert,
    closeNoContactsModal,
    openWhatsApp,
  }), [
    shakeEnabled,
    setShakeEnabled,
    isConfirmingSOS,
    isSOSActive,
    noContactsModalVisible,
    startSOSConfirmation,
    cancelSOSConfirmation,
    confirmSOS,
    stopSOS,
    sendSOSAlert,
    closeNoContactsModal,
    openWhatsApp,
  ]);

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

export const useSOS = (): SOSContextType => {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOS must be used within a SOSProvider');
  }
  return context;
};