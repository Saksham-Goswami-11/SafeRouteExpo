import React, { useEffect, useRef, useState } from 'react';
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
import NewsAnalyzerTester from './src/components/NewsAnalyzerTester';
import SOSConfirmationModal from './src/components/SOSConfirmationModal';
import { ProfileStackParamList } from './src/navigation/ProfileStack';

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
function HomeScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shareLocation = async () => {
    try {
      console.log("Fetching live location for sharing...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to share your location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const message = `Hi! I'm sharing my current location with you: https://maps.google.com/?q=${latitude},${longitude}`;
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share location. Please ensure WhatsApp is installed.');
    }
  };

  const planRoute = () => {
    navigation.navigate('Navigate');
  };

  const handleEmergency = () => {
    const phoneNumber = '911';
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Action Not Supported', 'Unable to open the phone dialer on this device.');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight, colors.backgroundCard]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>AMBA 🛡️</Text>
            <Text style={styles.subtitle}>Your Personal Safety Companion</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionCardWrapper} onPress={handleEmergency}>
              <LinearGradient
                colors={[colors.danger, shade(colors.danger, -15), colors.accent]}
                style={styles.actionCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.actionIcon}>🚨</Text>
                <Text style={styles.actionText}>Emergency</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.actionCardWrapper} onPress={shareLocation}>
              <LinearGradient
                colors={[colors.safe, shade(colors.safe, -15)]}
                style={styles.actionCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.actionIcon}>📍</Text>
                <Text style={styles.actionText}>Share Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Safety Score Card */}
          <View style={styles.safetyCard}>
            <LinearGradient
              colors={[colors.backgroundCard, colors.backgroundLight]}
              style={styles.safetyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.safetyTitle}>Current Area Safety</Text>
              <View style={styles.safetyScore}>
                <Text style={styles.scoreNumber}>85</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            <Text style={[styles.safetyStatus, { color: colors.safe }]}>✅ Safe Zone</Text>
            </LinearGradient>
          </View>

          {/* Route Input Card */}
          <TouchableOpacity activeOpacity={0.8} style={styles.routeCard} onPress={planRoute}>
            <LinearGradient
              colors={[colors.primary, shade(colors.primary, -15)]}
              style={styles.routeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.routeIcon}>🗺️</Text>
              <Text style={styles.routeText}>Plan Your Safe Route</Text>
              <Text style={styles.routeArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* News Analyzer Tester */}
          <NewsAnalyzerTester />
          
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

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
      } catch {}
    })();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
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
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="NearbyPlaces" component={NearbyPlacesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function AppContent() {
  // Safely get properties from the context, providing fallbacks.
  const sosContext = useSOS();
  const isConfirmingSOS = sosContext?.isConfirmingSOS ?? false;
  const confirmSOS = sosContext?.confirmSOS ?? (() => {});
  const cancelSOSConfirmation = sosContext?.cancelSOSConfirmation ?? (() => {});


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
      <SOSConfirmationModal visible={isConfirmingSOS} onConfirm={handleConfirm} onCancel={cancelSOSConfirmation} />
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