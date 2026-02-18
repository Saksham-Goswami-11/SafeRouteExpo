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
import FakeCallScreen from './src/screens/FakeCallScreen';
import ProfileStack from './src/navigation/ProfileStack';
import NearbyPlacesScreen from './src/screens/NearbyPlacesScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import GuardianScreen from './src/screens/GuardianScreen';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import * as Location from 'expo-location';
import { SOSProvider, useSOS } from './src/context/SOSContext';
import { useShakeSOS } from './src/features/sos/useShakeSOS';
import { initDB } from './src/services/sqlite';
import { auth } from './src/services/firebaseClient';
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
  FakeCall: { callerName?: string };
  Contacts: undefined;
  Guardian: undefined;
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
            <Stack.Screen name="FakeCall" component={FakeCallScreen} />
            <Stack.Screen name="Contacts" component={ContactsScreen} />
            <Stack.Screen name="Guardian" component={GuardianScreen} />
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


  /* 
   * FIXED: We now delegate the SOS confirmation logic entirely to the SOSContext.
   * This ensures that Firestore tracking, SMS Blasts (expo-sms), and WhatsApp fallbacks 
   * are handled centrally and correctly.
   */
  const handleConfirm = () => {
    confirmSOS();
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