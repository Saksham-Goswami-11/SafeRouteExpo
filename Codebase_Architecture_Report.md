# Codebase Architecture Report

## Section 1: Tech Stack & Dependencies

### Package.json Dependencies
```json
"dependencies": {
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/native": "^6.1.17",
  "@react-navigation/stack": "^6.3.29",
  "expo": "^54.0.23",
  "expo-auth-session": "~7.0.8",
  "expo-blur": "~15.0.8",
  "expo-constants": "~18.0.10",
  "expo-crypto": "~15.0.7",
  "expo-dev-client": "~6.0.17",
  "expo-device": "~8.0.9",
  "expo-file-system": "~19.0.17",
  "expo-image-picker": "~17.0.8",
  "expo-linear-gradient": "~15.0.7",
  "expo-location": "~19.0.7",
  "expo-sensors": "~15.0.7",
  "expo-sqlite": "~16.0.9",
  "expo-status-bar": "~3.0.8",
  "expo-web-browser": "~15.0.9",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-dotenv": "^3.4.11",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-get-random-values": "^1.11.0",
  "react-native-maps": "1.20.1",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-url-polyfill": "^3.0.0",
  "react-native-web": "^0.21.0",
  "react-native-worklets": "^0.5.1"
},
"devDependencies": {
  "@babel/register": "^7.28.3",
  "@testing-library/jest-native": "^5.4.3",
  "@types/react": "19.1.10",
  "babel-preset-expo": "^54.0.7",
  "dotenv": "^17.2.3",
  "jest": "^29.7.0",
  "jest-expo": "^54.0.13",
  "react-refresh": "^0.18.0",
  "react-test-renderer": "^19.2.0",
  "typescript": "^5.9.3"
}
```

*   **UI Library**: The project primarily uses raw `StyleSheet` from `react-native`. There are also some uses of `expo-linear-gradient` and `expo-blur` for visual effects. No major UI component library (like Tamagui or Paper) is listed in dependencies.
*   **Navigation Library**: `React Navigation v6` (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`).

## Section 2: Project Structure

```text
src/
  ├── components/
  │   ├── AIBackendTester.tsx
  │   ├── BreathingOrb.tsx
  │   ├── CustomTabBar.tsx
  │   ├── NewsAnalyzerTester.tsx
  │   ├── NoContactsModal.tsx
  │   └── SOSConfirmationModal.tsx
  ├── config/
  ├── context/
  │   ├── AuthContext.tsx
  │   ├── SOSContext.tsx
  │   └── ThemeContext.tsx
  ├── features/
  │   └── sos/
  │       └── useShakeSOS.ts
  ├── navigation/
  │   ├── ProfileStack.tsx
  │   └── types.ts
  ├── screens/
  │   ├── auth/ (Login/Signup)
  │   ├── profile/ (EditProfile/EmergencyContacts/etc)
  │   ├── HomeScreen.tsx
  │   ├── MapScreen.tsx
  │   ├── NearbyPlacesScreen.tsx
  │   ├── ProfileScreen.tsx
  │   └── SafetyScreen.tsx
  ├── services/
  │   ├── addressService.ts
  │   ├── api.ts
  │   ├── contactsService.ts
  │   ├── firebaseClient.ts
  │   ├── placesService.ts
  │   ├── profileService.ts
  │   ├── sqlite.ts
  │   └── userService.ts
  └── utils/
```

## Section 3: Critical Logic Implementation

1.  **SOS Logic**:
    *   **Handler**: `src/context/SOSContext.tsx`
    *   **Implementation**: A React Context (`SOSProvider`) manages the state `isConfirmingSOS`. It exposes a `startSOSConfirmation()` function which checks if the user has emergency contacts. If yes, it shows the SOS modal; if no, it shows a "No Contacts" modal prompt.
    *   **Trigger**: The actual confirmation logic (sending WhatsApp message) is handled in the `App.tsx` component `AppContent` which uses the context functions.

2.  **Shake Detection**:
    *   **Library**: `expo-sensors` (`Accelerometer`)
    *   **Handler**: `src/features/sos/useShakeSOS.ts`
    *   **Listener Location**: The hook `useShakeSOS` handles the accelerometer subscription. It is instantiated in `App.tsx` within the `ShakeSOSManager` component, ensuring it's active globally when enabled in settings.

3.  **Location Tracking**:
    *   **Implementation**: `expo-location` is used.
    *   **Usage**: `App.tsx` requests foreground permissions on startup. Real-time tracking seems to be handled in `MapScreen.tsx` (implied by file name) or on-demand for SOS features (requesting current position in `App.tsx` handling). There isn't explicit background location service code visible in the `src/services` list summary, though permissions might be requested.

4.  **Navigation**:
    *   **Definition**: The main navigation structure is defined in `App.tsx`.
    *   **Structure**: It uses a `Stack.Navigator` as the root, which contains a "Main" screen (the `MainTabNavigator`) and a modal-like "NearbyPlaces" screen. The `MainTabNavigator` implements a bottom tab bar using `CustomTabBar.tsx`.

### Navigation Code Snippet (from App.tsx)
```tsx
function MainTabNavigator() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
     // ... status bar and init logic
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} ... />
      <Tab.Screen name="Navigate" component={MapScreen} ... />
      <Tab.Screen name="Safety" component={SafetyScreen} ... />
      <Tab.Screen name="Profile" component={ProfileStack} ... />
    </Tab.Navigator>
  );
}
```

## Section 4: Critical File Contents

### 1. App.tsx
```tsx
import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import 'react-native-url-polyfill/auto';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Linking,
} from 'react-native';

import { NavigatorScreenParams } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens import
import CustomTabBar from './src/components/CustomTabBar';
import MapScreen from './src/screens/MapScreen';
import SafetyScreen from './src/screens/SafetyScreen';
import ProfileStack from './src/navigation/ProfileStack';
import NearbyPlacesScreen from './src/screens/NearbyPlacesScreen';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import * as Location from 'expo-location';
import { SOSProvider, useSOS } from './src/context/SOSContext';
import { useShakeSOS } from './src/features/sos/useShakeSOS';
import { initDB } from './src/services/sqlite';
import { runStartupCleanup } from './src/utils/databaseCleanup';
import SOSConfirmationModal from './src/components/SOSConfirmationModal';
import NoContactsModal from './src/components/NoContactsModal'; // Import the new modal
import { ProfileStackParamList } from './src/navigation/types';

// --- NAVIGATION TYPES ---
// It's best practice to keep these in a dedicated types file,
// but for now, we'll define them here to fix the errors.

export type RootTabParamList = {
  Home: undefined;
  Navigate: undefined;
  Safety: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<RootTabParamList>;
  NearbyPlaces: { type: 'hospital' | 'police' };
};

// Helper to lighten/darken hex colors (percent: -100..100)
function shade(hex: string, percent: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const amt = Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  const out = (r << 16) | (g << 8) | b;
  return `#${out.toString(16).padStart(6, '0')}`;
}

/**
 * A dedicated component to handle the Shake to SOS feature.
 * This component will re-render when the SOS context changes,
 * correctly enabling or disabling the shake listener.
 */
function ShakeSOSManager() {
  // Get the full context object to safely check for new properties.
  const sosContext = useSOS();
  const enabled = sosContext?.shakeEnabled ?? false;
  const isConfirmingSOS = sosContext?.isConfirmingSOS ?? false;

  // This callback will trigger the SOS confirmation modal.
  const handleShake = React.useCallback(() => {
    // Only start confirmation if the function exists on the context and we're not already confirming.
    if (enabled && !isConfirmingSOS && typeof sosContext.startSOSConfirmation === 'function') {
      console.log('Shake detected! Starting SOS confirmation...');
      sosContext.startSOSConfirmation();
    }
  }, [enabled, isConfirmingSOS, sosContext]);

  // This safely calls useShakeSOS.
  useShakeSOS(enabled, handleShake);

  return null; // This component does not render anything
}

/**
 * A dedicated component to handle the Voice to SOS feature.
 */
// function VoiceSOSManager() {
//   const sosContext = useSOS();
//   const enabled = sosContext?.voiceEnabled ?? false;
//   const isConfirmingSOS = sosContext?.isConfirmingSOS ?? false;
//   const handleActivation = React.useCallback(() => {
//     if (enabled && !isConfirmingSOS && typeof sosContext.startSOSConfirmation === 'function') {
//       console.log('Voice activation detected! Starting SOS confirmation...');
//       sosContext.startSOSConfirmation();
//     }
//   }, [enabled, isConfirmingSOS, sosContext]);
//   // useVoiceSOS(enabled, handleActivation);
//   return null; // This component does not render anything
// }

const { width, height } = Dimensions.get('window');

// Navigators
const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Home Screen Component
import HomeScreen from './src/screens/HomeScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Tab Navigator component
 */
function MainTabNavigator() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    // Init DB and request location permission on start
    (async () => {
      try {
        await initDB();
        await runStartupCleanup();
      } catch (e) {
        console.warn('DB init/cleanup error', e);
      }
    })();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        // silently ignore if denied
      } catch { }
    })();
  }, []);


  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Hide default tab bar style since we are replacing it
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Navigate"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={[
                styles.mainTabIcon,
                { backgroundColor: focused ? colors.primary : colors.backgroundCard },
              ]}
            >
              <Text style={{ fontSize: 28, color: focused ? '#FFFFFF' : color }}>🗺️</Text>
            </View>
          ),
          tabBarLabel: 'Navigate',
        }}
      />
      <Tab.Screen
        name="Safety"
        component={SafetyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🛡️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
function InnerApp() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="NearbyPlaces" component={NearbyPlacesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  // Safely get properties from the context, providing fallbacks.
  const sosContext = useSOS();
  const isConfirmingSOS = sosContext?.isConfirmingSOS ?? false;
  const confirmSOS = sosContext?.confirmSOS ?? (() => { });
  const cancelSOSConfirmation = sosContext?.cancelSOSConfirmation ?? (() => { });

  // New state and functions for the no-contacts modal
  const noContactsModalVisible = sosContext?.noContactsModalVisible ?? false;
  const openWhatsApp = sosContext?.openWhatsApp ?? (() => { });
  const closeNoContactsModal = sosContext?.closeNoContactsModal ?? (() => { });


  const handleConfirm = async () => {
    try {
      console.log("SOS Confirmed! Sending location...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to send your location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const message = `EMERGENCY! I need help. My current location is: https://maps.google.com/?q=${latitude},${longitude}`;
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        confirmSOS(); // Close modal after successfully opening WhatsApp
      } else {
        // Fallback for when WhatsApp is not installed
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
        confirmSOS(); // Close modal after successfully opening web link
      }
    } catch (error) {
      Alert.alert('Error', 'Could not send location. Please ensure you have an internet connection.');
    }
  };

  return (
    <>
      <InnerApp />
      <SOSConfirmationModal
        visible={isConfirmingSOS}
        onConfirm={handleConfirm}
        onCancel={cancelSOSConfirmation}
      />
      <NoContactsModal
        visible={noContactsModalVisible}
        onClose={closeNoContactsModal}
        onConfirm={openWhatsApp}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SOSProvider>
          <ShakeSOSManager />
          {/* <VoiceSOSManager /> */}
          <AppContent />
        </SOSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ... aapke poore styles ...
const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  actionCardWrapper: {
    flex: 1,
  },
  actionCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  safetyCard: {
    marginBottom: 20,
  },
  safetyGradient: {
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  safetyTitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  safetyScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.safe,
  },
  scoreLabel: {
    fontSize: 20,
    color: colors.textMuted,
  },
  safetyStatus: {
    fontSize: 16,
    color: colors.safe,
    fontWeight: '600',
  },
  routeCard: {
    marginBottom: 20,
  },
  routeGradient: {
    padding: 25,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeIcon: {
    fontSize: 30,
  },
  routeText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  routeArrow: {
    fontSize: 24,
    color: colors.text,
  },
  screenIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 10,
  },
  screenSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  mainTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
```

### 2. src/screens/HomeScreen.tsx
```tsx
import React, { useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useSOS } from '../context/SOSContext';
import { BreathingOrb } from '../components/BreathingOrb';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const { startSOSConfirmation } = useSOS();

    const handleSOS = () => {
        startSOSConfirmation();
    };

    const shareLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;
            const message = `Hi! I'm sharing my live location: https://maps.google.com/?q=${latitude},${longitude}`;
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not share location.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Background: OLED Black + Aurora */}
            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={['#050505', '#1A0033']} // Deep black to very dark violet
                    style={styles.backgroundFill}
                />
                {/* Aurora Borealis Effect */}
                <LinearGradient
                    colors={['transparent', 'rgba(127, 0, 255, 0.2)', 'rgba(0, 240, 255, 0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aurora}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(1000)} style={styles.headerWrapper}>
                    <BlurView intensity={20} tint="light" style={styles.glassHeader}>
                        <View>
                            <Text style={styles.brandTitle}>Amba</Text>
                            <Text style={styles.brandSubtitle}>Your Guardian</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Text style={styles.bellIcon}>🔔</Text>
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>

                {/* Breathing Orb (SOS) */}
                <Animated.View entering={FadeIn.delay(300).duration(1000)} style={styles.orbContainer}>
                    <BreathingOrb onSOS={handleSOS} />
                    <View style={styles.statusPill}>
                        <BlurView intensity={10} style={styles.pillBlur}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Live Tracking Active</Text>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Floating Glass Tiles */}
                <Animated.View entering={SlideInDown.delay(500).springify()} style={styles.gridContainer}>

                    {/* Track Me */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.tileWrapper}
                        onPress={() => navigation.navigate('Navigate')}
                    >
                        <BlurView intensity={15} tint="light" style={styles.glassTile}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.tileIcon}>🗺️</Text>
                            <Text style={styles.tileLabel}>Track Me</Text>
                        </BlurView>
                    </TouchableOpacity>

                    {/* Safe Route */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.tileWrapper}
                        onPress={() => navigation.navigate('Navigate')}
                    >
                        <BlurView intensity={15} tint="light" style={styles.glassTile}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.tileIcon}>🛡️</Text>
                            <Text style={styles.tileLabel}>Safe Route</Text>
                        </BlurView>
                    </TouchableOpacity>

                    {/* Share Location */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.tileWrapper}
                        onPress={shareLocation}
                    >
                        <BlurView intensity={15} tint="light" style={styles.glassTile}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.tileIcon}>📍</Text>
                            <Text style={styles.tileLabel}>Share Loc</Text>
                        </BlurView>
                    </TouchableOpacity>

                </Animated.View>

                {/* Safety Score Preview */}
                <Animated.View entering={SlideInDown.delay(700).springify()} style={styles.scoreCardWrapper}>
                    <BlurView intensity={20} tint="dark" style={styles.scoreCard}>
                        <View style={styles.scoreHeader}>
                            <Text style={styles.scoreTitle}>Current Safety Score</Text>
                        </View>
                        <View style={styles.scoreRow}>
                            <Text style={styles.scoreVal}>85</Text>
                            <Text style={styles.scoreMax}>/100</Text>
                            <View style={styles.safeBadge}>
                                <Text style={styles.safeText}>SAFE ZONE</Text>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    backgroundFill: {
        flex: 1,
    },
    aurora: {
        position: 'absolute',
        top: -100,
        left: 0,
        right: 0,
        height: 500,
        opacity: 0.6,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 100,
    },
    headerWrapper: {
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    glassHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    brandTitle: {
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 2,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bellIcon: {
        fontSize: 18,
    },
    orbContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 50,
    },
    statusPill: {
        marginTop: 30,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    pillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00F0FF',
        marginRight: 8,
        shadowColor: '#00F0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
    },
    statusText: {
        color: '#00F0FF',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    tileWrapper: {
        width: (width - 60) / 3,
        height: 100,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    glassTile: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    tileIcon: {
        fontSize: 28,
        marginBottom: 10,
    },
    tileLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    scoreCardWrapper: {
        paddingHorizontal: 20,
    },
    scoreCard: {
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scoreHeader: {
        marginBottom: 10,
    },
    scoreTitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreVal: {
        fontSize: 36,
        fontWeight: '700',
        color: '#00F0FF',
        marginRight: 5,
    },
    scoreMax: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.4)',
        marginRight: 15,
    },
    safeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 0, 0.3)',
    },
    safeText: {
        color: '#4ADE80',
        fontSize: 10,
        fontWeight: '700',
    },
});

export default HomeScreen;
```

### 3. src/services/sqlite.ts
```ts
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export type SQLResult<T = any> = T & { insertId?: number };

export interface User {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  created_at: number;
}

export interface AuthSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDB() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('saferoute.db');
  return _db;
}

async function exec(sql: string, params: any[] = []) {
  const db = await getDB();
  return await db.runAsync(sql, params);
}

export async function initDB() {
  // Users table with authentication fields
  await exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    created_at INTEGER
  );`);

  // Authentication sessions table
  await exec(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT,
    dark_mode INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    phone TEXT,
    relation TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at INTEGER
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS saved_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    label TEXT,
    address_text TEXT,
    latitude REAL,
    longitude REAL,
    created_at INTEGER
  );`);

  // --- MIGRATIONS ---
  // Upgrade emergency_contacts with new columns for "Nano Banana Pro" UI
  const migrationCols = [
    { name: 'avatar_uri', def: 'TEXT' },
    { name: 'relationship_label', def: 'TEXT' },
    { name: 'is_active_simulated', def: 'INTEGER DEFAULT 0' }
  ];

  for (const col of migrationCols) {
    try {
      await exec(`ALTER TABLE emergency_contacts ADD COLUMN ${col.name} ${col.def};`);
    } catch (e) {
      // Column likely already exists, ignore error
      // console.log(`Column ${col.name} already exists or could not be added.`);
    }
  }

  // --- NEW TABLES ---
  await exec(`CREATE TABLE IF NOT EXISTS alert_history (
    id TEXT PRIMARY KEY,
    type TEXT, -- 'SOS_SENT', 'FALSE_ALARM', 'SYSTEM_TEST'
    timestamp INTEGER,
    location_snapshot TEXT, -- JSON string of {latitude, longitude}
    is_synced INTEGER DEFAULT 0
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );`);

  // Insert default settings if they don't exist
  await exec(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('ghost_mode', 'false');`);

  // Verify schema after updates
  await verifySchema();
}

/**
 * Helper to verify schema changes by logging table info to console.
 * Call this manually or from initDB during development.
 */
export async function verifySchema() {
  console.log('--- Verifying Database Schema ---');
  try {
    const tables = ['emergency_contacts', 'alert_history', 'app_settings'];
    for (const table of tables) {
      const info = await query(`PRAGMA table_info(${table})`);
      console.log(`Table: ${table}`);
      console.log(info.map((col: any) => ` - ${col.name} (${col.type})`).join('\n'));
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
  console.log('--- Schema Verification Complete ---');
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDB();
  const result = await db.getAllAsync<T>(sql, params);
  return result || [];
}

export async function run(sql: string, params: any[] = []) {
  const db = await getDB();
  await db.runAsync(sql, params);
}

// Authentication functions
export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'SafeRoute_Salt_2024' // Add a salt for security
  );
}

export async function generateToken(): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString() + Date.now().toString()
  );
}

export async function createUser(email: string, password: string, fullName: string): Promise<User> {

  const id = Crypto.randomUUID();

  const passwordHash = await hashPassword(password);

  const createdAt = Date.now();



  const db = await getDB();

  await db.runAsync(

    'INSERT INTO users (id, email, full_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',

    [id, email.toLowerCase(), fullName, passwordHash, createdAt]

  );



  return {

    id,

    email: email.toLowerCase(),

    full_name: fullName,

    password_hash: passwordHash,

    created_at: createdAt

  };

}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const passwordHash = await hashPassword(password);
  const users = await query<User>(
    'SELECT * FROM users WHERE email = ? AND password_hash = ?',
    [email.toLowerCase(), passwordHash]
  );

  return users.length > 0 ? users[0] : null;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = await generateToken();
  const token = await generateToken();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  const createdAt = Date.now();

  const db = await getDB();
  await db.runAsync(
    'INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, token, expiresAt, createdAt]
  );

  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  const now = Date.now();
  const sessions = await query<AuthSession & User & { user_created_at: number }>(
    `SELECT s.*, u.id, u.email, u.full_name, u.created_at as user_created_at 
     FROM auth_sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.token = ? AND s.expires_at > ?`,
    [token, now]
  );

  if (sessions.length === 0) return null;

  const session = sessions[0];
  return {
    id: session.user_id, // Use the user_id from the session, not the session's own id
    email: session.email,
    full_name: session.full_name,
    password_hash: '', // Don't return password hash
    created_at: session.user_created_at
  };
}

export async function invalidateSession(token: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM auth_sessions WHERE token = ?', [token]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await query<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  return users.length > 0 ? users[0] : null;
}
```
