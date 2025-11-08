import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
// --- AI INTEGRATION: Import AI analyzer and config ---
import {
  aiSafetyAnalyzer,
  calculateAIOverallSafetyScore,
} from '../utils/aiSafetyAnalyzer';
import { SafetySegment } from '../utils/safetyAnalysis'; // Keep type for compatibility
import { DEVELOPMENT_MODE } from '../config/aiConfig';
// --- END AI INTEGRATION ---
import { useAuth } from '../context/AuthContext';
import { fetchSavedAddresses, SavedAddress, addSavedAddress } from '../services/addressService';

// --- REAL ROUTING INTEGRATION ---
// IMPORTANT: Add your Google Maps API Key here
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY; 

const { width, height } = Dimensions.get('window');

// Colors come from ThemeContext 

// Dark map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
];

export default function MapScreen() {
  const { colors, darkMode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [safetySegments, setSafetySegments] = useState<SafetySegment[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [showSaferAlternative, setShowSaferAlternative] = useState(false);
  const [alternativeAttempt, setAlternativeAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showRouteInput, setShowRouteInput] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SafetySegment | null>(null);
  const { user } = useAuth();
  const [isSafetyCardMinimized, setIsSafetyCardMinimized] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [startSuggestions, setStartSuggestions] = useState<SavedAddress[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<SavedAddress[]>([]);
  
  // Navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);

  const styles = makeStyles(colors);

  // Request location permission and get current location
  useEffect(() => {
    // Stop any existing watchers when the component unmounts
    return () => {
      locationWatcher.current?.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRegion({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
    })();
  }, []);

  // Load saved addresses on auth/user change
  useEffect(() => {
    (async () => {
      if (user) {
        try {
          const list = await fetchSavedAddresses(user.id);
          setSavedAddresses(list);
        } catch (e) {
          console.log('Saved addresses load error:', e);
        }
      } else {
        setSavedAddresses([]);
      }
    })();
  }, [user?.id]);

  // Memoized suggestions to avoid recalculation on every render
  const startSuggestionsMemo = useMemo(() => {
    const q = startLocation.toLowerCase().trim();
    return q ? savedAddresses.filter(a => 
      a.label.toLowerCase().includes(q) || 
      a.address_text.toLowerCase().includes(q)
    ).slice(0, 5) : savedAddresses.slice(0, 5);
  }, [startLocation, savedAddresses]);

  const endSuggestionsMemo = useMemo(() => {
    const q = endLocation.toLowerCase().trim();
    return q ? savedAddresses.filter(a => 
      a.label.toLowerCase().includes(q) || 
      a.address_text.toLowerCase().includes(q)
    ).slice(0, 5) : savedAddresses.slice(0, 5);
  }, [endLocation, savedAddresses]);

  // Save input as saved address (if logged in)
  const saveAddress = async (which: 'start' | 'end') => {
    try {
      if (!user) {
        Alert.alert('Login required', 'Please log in to save addresses.');
        return;
      }
      const text = which === 'start' ? startLocation : endLocation;
      if (!text) return;
      const coords = await geocodeAddress(text);
      if (!coords) {
        Alert.alert('Not found', 'Unable to geocode this address.');
        return;
      }
      await addSavedAddress(user.id, {
        label: which === 'start' ? 'Start' : 'Destination',
        address_text: text,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const list = await fetchSavedAddresses(user.id);
      setSavedAddresses(list);
      Alert.alert('Saved', 'Address saved to your profile');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save address');
    }
  };

  // Optimized current location usage
  const useCurrentLocation = useCallback(async () => {
    try {
      if (currentLocation) {
        setStartLocation(`${currentLocation.latitude}, ${currentLocation.longitude}`);
      } else {
        let location = await Location.getCurrentPositionAsync({});
        setStartLocation(`${location.coords.latitude}, ${location.coords.longitude}`);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Unable to get current location');
    }
  }, [currentLocation]);

  // Geocode address to coordinates
  const geocodeAddress = async (address: string) => {
    try {
      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }
    } catch (error) {
      console.log('Geocoding error:', error);
    }
    
    // Try to parse as coordinates
    const coordMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
      };
    }
    
    return null;
  };

  // Throttled route generation to prevent multiple concurrent calls
  const generateRoute = useCallback(async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Error', 'Please enter both start and end locations');
      return;
    }

    // --- AI INTEGRATION: Use AI Analyzer ---
    console.log('🤖 Using AI-powered safety analysis...');
    setIsLoading(true);
    
    const start = await geocodeAddress(startLocation);
    const end = await geocodeAddress(endLocation);

    if (!start || !end) {
      Alert.alert('Error', 'Could not find one or both locations. Please check the addresses.');
      setIsLoading(false);
      return;
    }

    let routePoints: { latitude: number; longitude: number; }[] = [];

    // Generate route coordinates
    /*
    const routePoints = generateRoutePoints(start, end, alternativeAttempt); // This function is still used for the path

    // Analyze route segments using the AI analyzer
    const segments = await aiSafetyAnalyzer.analyzeRouteSegments(routePoints, alternativeAttempt > 0);

    // Calculate overall score using the AI-compatible function
    const score = calculateAIOverallSafetyScore(segments);

    setRouteCoordinates(routePoints); // Set coordinates after analysis
    setSafetySegments(segments);
    setOverallScore(score);
    setShowSaferAlternative(true);
    */

    try {
      const mode = 'driving'; // or 'walking', 'bicycling'
      const alternatives = alternativeAttempt > 0;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=${mode}&alternatives=${alternatives}`;

      const res = await fetch(url);
      const json = await res.json();

      // --- IMPROVED ERROR HANDLING ---
      // Check the status from the Google Directions API response
      if (json.status !== 'OK') {
        let errorMessage = 'Could not find a route. Please try different locations.';
        switch (json.status) {
          case 'NOT_FOUND':
            errorMessage = 'One or both of the locations could not be found. Please check your addresses.';
            break;
          case 'ZERO_RESULTS':
            errorMessage = 'No route could be found between the start and end points.';
            break;
          case 'REQUEST_DENIED':
            errorMessage = 'Routing request was denied. Please check if the Google Maps API key is valid and has the Directions API enabled.';
            console.error('Directions API Error:', json.error_message);
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage = 'The app has exceeded its request limit for today. Please try again later.';
            break;
        }
        Alert.alert('No Route Found', errorMessage);
        setIsLoading(false);
        return;
      }

      const route = json.routes[0]; // Use the first route
      const points = decodePolyline(route.overview_polyline.points);
      routePoints = points.map(point => ({
        latitude: point[0],
        longitude: point[1],
      }));

      // --- PERFORMANCE IMPROVEMENT ---
      // 1. Immediately show the route to the user for instant feedback.
      // We'll draw it as a single, neutral-colored line for now.
      setRouteCoordinates(routePoints);
      setNavigationSteps(route.legs[0].steps); // Save real navigation steps
      setShowSaferAlternative(true);
      setOverallScore(0); // Reset score while analyzing
      setSafetySegments([]); // Clear old segments

      // Fit map to the new route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(routePoints, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }

      // 2. Run the heavy AI analysis in the background.
      // This is a non-blocking call, so the UI remains responsive.
      (async () => {
        const segments = await aiSafetyAnalyzer.analyzeRouteSegments(routePoints, alternativeAttempt > 0);
        const score = calculateAIOverallSafetyScore(segments);
        setSafetySegments(segments); // Update the route colors
        setOverallScore(score); // Update the score card
      })();

    } catch (error) {
      console.error("Directions API error:", error);
      Alert.alert('Routing Error', 'Failed to fetch route. Please check your API key and network connection.');
    }

    // --- END AI INTEGRATION ---

    // Fit map to show entire route
    setIsLoading(false);
    setShowRouteInput(false);
  }, [startLocation, endLocation, alternativeAttempt, mapRef.current]);

  const findSaferRoute = useCallback(() => {
    setAlternativeAttempt(prev => prev + 1);
  }, []);

  // Re-run route generation when a safer alternative is requested
  useEffect(() => {
    // We only want this to run when the button is pressed, not on the initial load (attempt 0)
    if (alternativeAttempt > 0) {
      generateRoute();
    }
  }, [alternativeAttempt]);

  // Memoized distance calculation to avoid repeated computation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Memoized bearing calculation
  const calculateBearing = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const x = Math.sin(Δλ) * Math.cos(φ2);
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(x, y);
    return (θ * 180/Math.PI + 360) % 360;
  }, []);

  // Memoized navigation steps to avoid recalculation
  const generateNavigationSteps = useCallback((routePoints: any[]) => {
    if (routePoints.length < 2) return [];
    
    const steps = [];
    let totalDistance = 0;
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const current = routePoints[i];
      const next = routePoints[i + 1];
      const distance = calculateDistance(current.latitude, current.longitude, next.latitude, next.longitude);
      const bearing = calculateBearing(current.latitude, current.longitude, next.latitude, next.longitude);
      
      // Determine direction based on bearing
      let direction = 'Continue straight';
      let icon = '⬆️';
      
      if (i > 0) {
        const prev = routePoints[i - 1];
        const prevBearing = calculateBearing(prev.latitude, prev.longitude, current.latitude, current.longitude);
        const turn = (bearing - prevBearing + 360) % 360;
        
        if (turn > 45 && turn < 135) {
          direction = 'Turn right';
          icon = '↗️';
        } else if (turn > 225 && turn < 315) {
          direction = 'Turn left';
          icon = '↖️';
        } else if (turn > 135 && turn < 225) {
          direction = 'Make a U-turn';
          icon = '↩️';
        }
      }
      
      totalDistance += distance;
      
      steps.push({
        instruction: direction,
        distance: Math.round(distance),
        totalDistance: Math.round(totalDistance),
        coordinate: current,
        icon: icon,
        bearing: bearing
      });
    }
    
    // Add final destination step
    steps.push({
      instruction: 'You have arrived at your destination',
      distance: 0,
      totalDistance: Math.round(totalDistance),
      coordinate: routePoints[routePoints.length - 1],
      icon: '🏁',
      bearing: 0
    });
    
    return steps;
  }, []);

  const reroute = () => {
    if (!userLocation) return;
    setStartLocation(`${userLocation.coords.latitude}, ${userLocation.coords.longitude}`);
  };
  // Optimized navigation start with loading state
  const startNavigation = useCallback(() => {
    if (routeCoordinates.length > 0) {
      if (navigationSteps.length === 0) {
        Alert.alert('Error', 'Navigation data is not available. Please generate a route first.');
        return;
      }
      try {
        setCurrentStepIndex(0);
        setIsNavigating(true);
        
        const totalDurationSeconds = navigationSteps.reduce((sum, step) => sum + step.duration.value, 0);
        const estimatedMinutes = Math.ceil(totalDurationSeconds / 60);
        setEstimatedTime(estimatedMinutes);
        
        // Close route input and safety card
        setShowRouteInput(false);
        setShowSaferAlternative(false);

        // --- LIVE NAVIGATION ---
        // Start watching the user's position
        (async () => {
          locationWatcher.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000, // Update every second
              distanceInterval: 10, // Update every 10 meters
            },
            (newLocation) => {
              setUserLocation(newLocation);
            }
          );
        })();

        // Animate camera to starting position
        if (mapRef.current) {
          mapRef.current.animateCamera({
            center: routeCoordinates[0],
            zoom: 18, // Zoom in for navigation
            heading: 0,
            pitch: 45,
          });
        }
      } catch (error) {
        console.error('Navigation start error:', error);
        Alert.alert('Error', 'Failed to start navigation. Please try again.');
      }
    }
  }, [routeCoordinates, navigationSteps]);

  // Optimized navigation stop
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsOffRoute(false);
    setCurrentStepIndex(0);
    setDistanceToNext(0);
    setEstimatedTime(0);
    setUserLocation(null);

    // Stop watching location
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
  }, []);

  // Effect for handling live navigation logic
  useEffect(() => {
    if (!isNavigating || !userLocation || navigationSteps.length === 0) {
      return;
    }

    const userCoords = userLocation.coords;

    // 1. Animate map to follow user
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userCoords,
        heading: userLocation.coords.heading ?? 0,
        zoom: 18, // Keep it zoomed in
        pitch: 45, // Keep the 3D perspective
      }, { duration: 500 });
    }

    // 2. Check for step advancement
    const nextStep = navigationSteps[currentStepIndex];
    if (!nextStep) return;

    const nextTurnCoords = nextStep.end_location;
    const distanceToTurn = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      nextTurnCoords.lat,
      nextTurnCoords.lng
    );

    setDistanceToNext(distanceToTurn);

    // Advance to next step if user is close enough to the turn
    if (distanceToTurn < 25) { // 25-meter threshold
      if (currentStepIndex < navigationSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // Reached destination
        Alert.alert('Destination Reached', 'You have arrived at your destination.');
        stopNavigation();
      }
    }

    // 3. Check for off-route
    const isOff = isUserOffRoute(userCoords, routeCoordinates);
    setIsOffRoute(isOff);

  }, [userLocation, isNavigating, navigationSteps]);

  // Re-run route generation if start location changes (for rerouting)
  useEffect(() => {
    if (isNavigating && startLocation !== `${userLocation?.coords.latitude}, ${userLocation?.coords.longitude}`) {
      generateRoute();
    }
  }, [startLocation, isNavigating]);

  // Helper to check if user is off-route
  const isUserOffRoute = (userCoords: Location.LocationObject['coords'], route: any[]) => {
    for (let i = 0; i < route.length - 1; i++) {
      const dist = distanceToLine(userCoords, route[i], route[i+1]);
      if (dist < 0.05) { // 50 meters threshold in km
        return false; // User is on-route
      }
    }
    return true; // User is off-route
  };

  const distanceToLine = (p: any, v: any, w: any) => { /* A helper function would be needed here */ return 999; };

  // Memoized route points generation
  const generateRoutePoints = useCallback((start: any, end: any, attempt: number) => {
    if (attempt > 0) {
      // This function is in safetyAnalysis.ts, which we are phasing out.
      // For now, we'll just add more curve to simulate an alternative.
      // In a real app, this would call a different routing API.
      console.log(`Generating alternative route, attempt: ${attempt}`);
    }

    // Generate a curved route between start and end with fewer points for better performance
    const points = [];
    const steps = 25; // Reduced from 50 to 25 for better performance
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add some curve to the route
      const curve = Math.sin(t * Math.PI) * (0.01 + attempt * 0.02); // More curve for alternatives
      
      points.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t + curve,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
    
    return points;
  }, []);

  // --- REAL ROUTING INTEGRATION ---
  // Helper to get an icon from a Google Maps maneuver string
  const getManeuverIcon = (maneuver?: string) => {
    if (!maneuver) return '⬆️'; // Straight
    if (maneuver.includes('turn-right')) return '➡️';
    if (maneuver.includes('turn-left')) return '⬅️';
    if (maneuver.includes('sharp-right')) return '↪️';
    if (maneuver.includes('sharp-left')) return '↩️';
    if (maneuver.includes('uturn')) return '🔄';
    if (maneuver.includes('roundabout')) return '🔄';
    if (maneuver.includes('fork')) return '🍴';
    if (maneuver.includes('merge')) return '🔀';
    if (maneuver.includes('on-ramp')) return '↗️';
    if (maneuver.includes('off-ramp')) return '↘️';
    if (maneuver.includes('straight')) return '⬆️';
    if (maneuver.includes('destination')) return '🏁';
    
    // Default for other cases like 'keep-right', 'keep-left'
    if (maneuver.includes('right')) return '↗️';
    if (maneuver.includes('left')) return '↖️';

    return '⬆️';
  };

  // Function to decode Google's encoded polyline strings
  const decodePolyline = (encoded: string) => {
    if (!encoded) {
      return [];
    }
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };
  // --- END REAL ROUTING INTEGRATION ---

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        customMapStyle={darkMode ? darkMapStyle : []}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Draw safety segments */}
        {routeCoordinates.length > 0 && safetySegments.length === 0 && (
          // While AI is analyzing, show a single neutral line
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={6}
          />
        )}
        {safetySegments.length > 0 &&
          safetySegments.map((segment, index) => (
            <Polyline
              key={index}
              coordinates={segment.coordinates}
              strokeColor={segment.color}
              strokeWidth={6}
              tappable={true}
              onPress={() => setSelectedSegment(segment)}
            />
          ))}

        {/* Live User Location Puck during Navigation */}
        {isNavigating && userLocation && (
          <Marker
            coordinate={userLocation.coords}
            anchor={{ x: 0.5, y: 0.5 }} // Center the icon on the coordinate
          >
            <View style={styles.userLocationPuck}>
              <Text style={[
                styles.userLocationPuckArrow,
                { transform: [{ rotate: `${userLocation.coords.heading || 0}deg` }] }
              ]}>
                ▲
              </Text>
            </View>
          </Marker>
        )}
        {/* Start and End markers */}
        {routeCoordinates.length > 0 && (
          <>
            <Marker coordinate={routeCoordinates[0]}>
              <View style={styles.markerContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.marker}
                >
                  <Text style={styles.markerText}>A</Text>
                </LinearGradient>
              </View>
            </Marker>
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]}>
              <View style={styles.markerContainer}>
                <LinearGradient
                  colors={[colors.danger, colors.accent]}
                  style={styles.marker}
                >
                  <Text style={styles.markerText}>B</Text>
                </LinearGradient>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      {/* Enhanced Route Input Modal */}
      <Modal
        visible={showRouteInput}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.modalBackdrop} />
          <View style={styles.enhancedRouteCard}>
            <LinearGradient
              colors={[colors.backgroundCard, colors.backgroundLight]}
              style={styles.cardGradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>🗺️</Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Plan Your Safe Route</Text>
                    <Text style={styles.modalSubtitle}>Get turn-by-turn navigation with safety insights</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowRouteInput(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Location Inputs */}
              <View style={styles.locationInputsContainer}>
                {/* Start Location */}
                <View style={styles.locationInputWrapper}>
                  <View style={styles.locationIconContainer}>
                    <View style={[styles.locationDot, { backgroundColor: colors.safe }]} />
                    <View style={styles.locationLine} />
                  </View>
                  <View style={styles.locationInputContent}>
                    <Text style={styles.locationInputLabel}>Start Location</Text>
                    <View style={styles.enhancedInputRow}>
                      <TextInput
                        style={styles.enhancedInput}
                        placeholder="Enter start or use current location"
                        placeholderTextColor={colors.textMuted}
                        value={startLocation}
                        onChangeText={setStartLocation}
                      />
                      <TouchableOpacity 
                        onPress={useCurrentLocation} 
                        style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                      >
                        <Text style={styles.actionButtonText}>📍</Text>
                      </TouchableOpacity>
                    </View>
                    {user && startSuggestionsMemo.length > 0 && (
                      <ScrollView style={styles.enhancedSuggestionsList} nestedScrollEnabled={true}>
                        {startSuggestionsMemo.slice(0, 3).map((s) => (
                          <TouchableOpacity 
                            key={s.id} 
                            style={styles.enhancedSuggestionItem} 
                            onPress={() => setStartLocation(s.address_text)}
                          >
                            <View style={styles.suggestionContent}>
                              <Text style={styles.suggestionTitle}>{s.label}</Text>
                              <Text style={styles.suggestionSubtitle}>{s.address_text}</Text>
                            </View>
                            <Text style={styles.suggestionArrow}>→</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>

                {/* Destination */}
                <View style={styles.locationInputWrapper}>
                  <View style={styles.locationIconContainer}>
                    <View style={[styles.locationDot, { backgroundColor: colors.danger }]} />
                  </View>
                  <View style={styles.locationInputContent}>
                    <Text style={styles.locationInputLabel}>Destination</Text>
                    <View style={styles.enhancedInputRow}>
                      <TextInput
                        style={styles.enhancedInput}
                        placeholder="Where do you want to go?"
                        placeholderTextColor={colors.textMuted}
                        value={endLocation}
                        onChangeText={setEndLocation}
                      />
                      <TouchableOpacity 
                        onPress={() => saveAddress('end')} 
                        style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
                      >
                        <Text style={styles.actionButtonText}>⭐</Text>
                      </TouchableOpacity>
                    </View>
                    {user && endSuggestionsMemo.length > 0 && (
                      <ScrollView style={styles.enhancedSuggestionsList} nestedScrollEnabled={true}>
                        {endSuggestionsMemo.slice(0, 3).map((s) => (
                          <TouchableOpacity 
                            key={s.id} 
                            style={styles.enhancedSuggestionItem} 
                            onPress={() => setEndLocation(s.address_text)}
                          >
                            <View style={styles.suggestionContent}>
                              <Text style={styles.suggestionTitle}>{s.label}</Text>
                              <Text style={styles.suggestionSubtitle}>{s.address_text}</Text>
                            </View>
                            <Text style={styles.suggestionArrow}>→</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity onPress={generateRoute} disabled={isLoading} style={styles.primaryActionButton}>
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.primaryActionGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.text} size="small" />
                    ) : (
                      <>
                        <Text style={styles.actionButtonIcon}>🛡️</Text>
                        <Text style={styles.primaryActionText}>Find Safest Route</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Quick Options */}
              <View style={styles.quickOptionsContainer}>
                <TouchableOpacity style={styles.quickOption}>
                  <Text style={styles.quickOptionIcon}>🏠</Text>
                  <Text style={styles.quickOptionText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickOption}>
                  <Text style={styles.quickOptionIcon}>🏢</Text>
                  <Text style={styles.quickOptionText}>Work</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickOption}>
                  <Text style={styles.quickOptionIcon}>🛒</Text>
                  <Text style={styles.quickOptionText}>Market</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Safety Score Card */}
      {showSaferAlternative && !showRouteInput && (
        <View style={styles.safetyScoreCard}>
          <LinearGradient
            colors={[colors.backgroundCard, colors.backgroundLight]}
            style={styles.safetyScoreGradient}
          >
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => setShowSaferAlternative(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.minimizeButton} onPress={() => setIsSafetyCardMinimized(!isSafetyCardMinimized)}>
              <Text style={styles.minimizeButtonText}>{isSafetyCardMinimized ? '↑' : '↓'}</Text>
            </TouchableOpacity>

            {!isSafetyCardMinimized ? (
              // --- Expanded View ---
              <>
                <Text style={styles.safetyScoreTitle}>Route Safety Score</Text>
                {overallScore > 0 ? (
                  <>
                    <View style={styles.scoreContainer}>
                      <Text style={[
                        styles.scoreNumber,
                        { color: overallScore >= 70 ? colors.safe : overallScore >= 40 ? colors.warning : colors.danger }
                      ]}>
                        {overallScore}
                      </Text>
                      <Text style={styles.scoreMax}>/100</Text>
                    </View>
                    
                    <Text style={styles.safetyMessage}>
                      {overallScore >= 70 
                        ? '✅ This route is safe!'
                        : overallScore >= 40
                        ? '⚠️ Use caution on this route'
                        : '🚨 High-risk areas detected'}
                    </Text>
                  </>
                ) : (
                  <View style={styles.analyzingContainer}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.analyzingText}>Analyzing route safety...</Text>
                  </View>
                )}

                <View style={styles.safetyActionButtons}>
                  {overallScore > 0 && overallScore < 70 && (
                    <TouchableOpacity onPress={findSaferRoute} style={styles.alternativeButton}>
                      <LinearGradient colors={[colors.warning, colors.secondary]} style={styles.saferRouteBtn}>
                        <Text style={styles.saferRouteBtnText}>✨ Find Safer Alternative</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity onPress={startNavigation} style={styles.navigationButton}>
                    <LinearGradient colors={[colors.primary, colors.accent]} style={styles.startNavBtn}>
                      <Text style={styles.navButtonIcon}>🧿</Text>
                      <Text style={styles.startNavBtnText}>Start Navigation</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // --- Minimized View ---
              <View style={styles.minimizedContent}>
                <Text style={styles.minimizedScoreText}>Score: {overallScore > 0 ? overallScore : '...'}</Text>
                <TouchableOpacity onPress={startNavigation} style={styles.minimizedStartButton}>
                  <LinearGradient colors={[colors.primary, colors.accent]} style={styles.minimizedStartGradient}>
                    <Text style={styles.navButtonIcon}>🧿</Text>
                    <Text style={styles.minimizedStartText}>Start</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      {/* Segment Info Modal */}
      {selectedSegment && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedSegment(null)}
        >
          <TouchableOpacity 
            style={styles.segmentModalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedSegment(null)}
          >
            <View style={styles.segmentInfoCard}>
              <Text style={styles.segmentTitle}>
                {selectedSegment.safetyReason?.level === 'safe' ? '✅ Safe Area' :
                 selectedSegment.safetyReason?.level === 'caution' ? '⚠️ Caution Area' :
                 '🚨 Unsafe Area'}
              </Text>
              
              <Text style={styles.segmentScore}>
                Safety Score: {selectedSegment.actualScore}/100
              </Text>

              {selectedSegment.safetyReason && (
                <>
                  <View style={styles.segmentSection}>
                    <Text style={styles.sectionTitle}>Why this rating?</Text>
                    {selectedSegment.safetyReason.reasons.map((reason, idx) => (
                      <Text key={idx} style={styles.bulletPoint}>• {reason}</Text>
                    ))}
                  </View>

                  <View style={styles.segmentSection}>
                    <Text style={styles.sectionTitle}>Recommendations:</Text>
                    {selectedSegment.safetyReason.recommendations.map((rec, idx) => (
                      <Text key={idx} style={styles.bulletPoint}>• {rec}</Text>
                    ))}
                  </View>

                  {selectedSegment.safetyReason.timeOfDay && (
                    <Text style={styles.timeInfo}>⏰ {selectedSegment.safetyReason.timeOfDay}</Text>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Turn-by-Turn Navigation UI */}
      {isNavigating && navigationSteps.length > 0 && (
        <>
          {/* --- NEW: Google Maps Style Top Instruction Panel --- */}
          <View style={styles.topNavContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.topNavPanel}
            >
              {currentStepIndex < navigationSteps.length && (
                <View style={styles.topNavContent}>
                  <View style={styles.topNavIconContainer}>
                    <Text style={styles.topNavIcon}>
                      {getManeuverIcon(navigationSteps[currentStepIndex]?.maneuver)}
                    </Text>
                  </View>
                  <View style={styles.topNavInstruction}>
                    <Text style={styles.topNavDistance}>
                      {distanceToNext > 0
                        ? `${Math.round(distanceToNext)} m`
                        : navigationSteps[currentStepIndex]?.distance.text}
                    </Text>
                    <Text style={styles.topNavText} numberOfLines={2}>
                      {navigationSteps[currentStepIndex]?.html_instructions.replace(/<[^>]*>?/gm, '') || 'Continue straight'}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* --- NEW: Google Maps Style Bottom Info Panel --- */}
          <View style={styles.bottomNavContainer}>
            <LinearGradient
              colors={[colors.backgroundCard, colors.backgroundLight]}
              style={styles.bottomNavPanel}
            >
              <Text style={styles.bottomNavDetails}>
                {(navigationSteps.reduce((sum, step) => sum + step.duration.value, 0) / 1000).toFixed(1)} km
              </Text>
              <TouchableOpacity onPress={stopNavigation} style={styles.bottomNavEndButton}>
                <Text style={styles.bottomNavEndButtonText}>End</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* --- NEW: Left-side circular controls --- */}
          <View style={styles.leftNavControlsContainer}>
            {/* Reroute Button */}
            {isOffRoute && (
              <TouchableOpacity style={[styles.leftNavControl, { backgroundColor: colors.warning }]} onPress={reroute}>
                <Text style={styles.leftNavControlIcon}>🔄</Text>
                <Text style={styles.leftNavControlText}>Reroute</Text>
              </TouchableOpacity>
            )}
            {/* Time remaining */}
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.leftNavControl}>
              <Text style={styles.leftNavTime}>{estimatedTime}</Text>
              <Text style={styles.leftNavTimeLabel}>min</Text>
            </LinearGradient>
          </View>

          {/* Reroute Button - now floating */}
          {isOffRoute && (
            <TouchableOpacity style={styles.rerouteButton} onPress={reroute}>
              <Text style={styles.rerouteButtonText}>Reroute</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Floating Action Button */}
      {!showRouteInput && !isNavigating && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setShowRouteInput(true);
            setAlternativeAttempt(0);
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.fabGradient}
          >
            <Text style={[styles.fabText, { color: colors.text }]}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.text,
  },
  markerText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userLocationPuck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userLocationPuckArrow: {
    color: 'white',
    fontSize: 14,
    lineHeight: 16,
  },
  rerouteButton: {
    position: 'absolute',
    // This style is now handled by leftNavControls
  },
  rerouteButtonText: { color: colors.text, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  routeInputCard: {
    width: width * 0.9,
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.backgroundCard,
  },
  routeInputTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationBtn: {
    minWidth: 50,
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationBtnText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  findRouteBtn: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  findRouteBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
  },
  safetyScoreCard: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
  },
  safetyScoreGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.backgroundCard,
  },
  minimizedSafetyCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  minimizeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  minimizedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimizedScoreText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  minimizedStartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  minimizedStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  minimizedStartText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetyScoreTitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: 20,
    color: colors.textMuted,
  },
  safetyMessage: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    marginBottom: 15,
  },
  analyzingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  analyzingText: {
    color: colors.textSecondary,
  },
  saferRouteBtn: {
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saferRouteBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  segmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentInfoCard: {
    width: width * 0.85,
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  segmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  segmentScore: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  segmentSection: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.text,
    marginVertical: 3,
    paddingLeft: 10,
  },
  timeInfo: {
    fontSize: 14,
    color: colors.warning,
    marginTop: 10,
    textAlign: 'center',
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  suggestionLabel: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  suggestionAddress: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  // Enhanced Modal Styles
  enhancedModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  enhancedRouteCard: {
    maxHeight: height * 0.8,
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  cardGradient: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerIconText: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationInputsContainer: {
    marginBottom: 25,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  locationIconContainer: {
    alignItems: 'center',
    paddingTop: 25,
    marginRight: 15,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationLine: {
    width: 2,
    height: 30,
    backgroundColor: colors.textMuted + '40',
    marginTop: 5,
  },
  locationInputContent: {
    flex: 1,
  },
  locationInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  enhancedInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  enhancedInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 15,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '20',
  },
  actionButton: {
    minWidth: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  enhancedSuggestionsList: {
    maxHeight: 120,
    marginTop: 10,
    backgroundColor: colors.background + '80',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '15',
  },
  enhancedSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '10',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  suggestionArrow: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  primaryActionButton: {
    height: 55,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  primaryActionText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '15',
  },
  quickOption: {
    alignItems: 'center',
    gap: 8,
  },
  quickOptionIcon: {
    fontSize: 24,
  },
  quickOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Safety Action Buttons
  safetyActionButtons: {
    gap: 12,
  },
  alternativeButton: {
    height: 45,
    borderRadius: 12,
    overflow: 'hidden',
  },
  navigationButton: {
    height: 50,
    borderRadius: 15,
    overflow: 'hidden',
  },
  startNavBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  navButtonIcon: {
    fontSize: 20,
  },
  startNavBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  // --- NEW: Google Maps Style Navigation UI ---
  topNavContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 15,
    right: 15,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  topNavPanel: {
    borderRadius: 20,
    padding: 15,
  },
  topNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  topNavIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavIcon: {
    fontSize: 32,
    color: colors.text,
  },
  topNavInstruction: {
    flex: 1,
  },
  topNavDistance: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  topNavText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.9,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 15,
  },
  bottomNavPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomNavDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomNavEndButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomNavEndButtonText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // --- NEW: Left Nav Controls ---
  leftNavControlsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 15,
    zIndex: 1000,
    gap: 10,
    alignItems: 'center',
  },
  leftNavControl: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  leftNavControlIcon: {
    fontSize: 24,
  },
  leftNavControlText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  leftNavTime: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  leftNavTimeLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    marginTop: -4,
  },
});
