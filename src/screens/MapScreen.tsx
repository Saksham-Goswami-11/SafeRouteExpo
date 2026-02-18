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
  StatusBar,
  Switch,
  Platform,
  FlatList,
  Keyboard,
  Linking, // Added for external maps
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Target, Navigation, MapPin } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { SafetySegment } from '../utils/safetyAnalysis';
import { useAuth } from '../context/AuthContext';
import { fetchSavedAddresses, SavedAddress, addSavedAddress } from '../services/addressService';
import { aiSafetyAnalyzer, calculateAIOverallSafetyScore } from '../utils/aiSafetyAnalyzer';

// IMPORTANT: Add your Google Maps API Key here
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const { width, height } = Dimensions.get('window');

// --- Custom Dark Map Style (Stealth Luxury) ---
const mapCustomStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

export default function MapScreen() {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();

  // --- STATE ---
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
  const [analyzedRoutes, setAnalyzedRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]); // For Autocomplete
  const [safetySegments, setSafetySegments] = useState<SafetySegment[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [showSaferAlternative, setShowSaferAlternative] = useState(false);
  const [alternativeAttempt, setAlternativeAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showRouteInput, setShowRouteInput] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SafetySegment | null>(null);
  const [safetyHotspots, setSafetyHotspots] = useState<any[]>([]);

  // Helper: Open External Maps
  const openMap = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    if (url) Linking.openURL(url);
  };


  // --- USER DATA MAPPING (For Request Compatibility) ---
  // Mapping existing complex states to simple names requested by user
  // const [allRoutes, setAllRoutes] = ... (This maps to parsed logic in traceRoute)
  const [allRoutes, setAllRoutes] = useState<any[]>([]);

  // LOD State
  const [allSafetyMarkers, setAllSafetyMarkers] = useState<any[]>([]);
  const [visibleSafetyMarkers, setVisibleSafetyMarkers] = useState<any[]>([]);
  const [isZoomedOut, setIsZoomedOut] = useState(true); // Default to city view

  // Safety Filters
  const [showPolice, setShowPolice] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);

  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Ghost Mode
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [currentAddressLabel, setCurrentAddressLabel] = useState("Locating...");

  // Navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [selectedRouteLeg, setSelectedRouteLeg] = useState<any>(null);
  const [navStats, setNavStats] = useState({ duration: '', distance: '', arrivalTime: '' });
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);

  // --- EFFECTS ---

  // Stop watchers on unmount
  useEffect(() => {
    return () => {
      locationWatcher.current?.remove();
    };
  }, []);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setCurrentAddressLabel("Location Access Denied");
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

      // Reverse Geocode for HUD
      try {
        const addr = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (addr && addr.length > 0) {
          const a = addr[0];
          setCurrentAddressLabel(`${a.street || a.name || ''}, ${a.city}`);
        } else {
          setCurrentAddressLabel(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
        }
      } catch (e) {
        setCurrentAddressLabel("Unknown Location");
      }

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


  // --- LOGIC: SAVED ADDRESSES & GEOCODING ---

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
    const coordMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
      };
    }
    return null;
  };

  const decodePolyline = (t: string) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };

  // --- LOGIC: AUTOCOMPLETE ---

  const fetchSuggestions = async (query: string) => {
    setEndLocation(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        setSuggestions(json.predictions);
      }
    } catch (e) {
      console.log("Autocomplete error:", e);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    Keyboard.dismiss();
    setEndLocation(description);
    setSuggestions([]);

    let startCoords = null;
    // Fix: currentLocation has flat structure { latitude, longitude }
    if (currentLocation) {
      startCoords = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
      if (!startLocation) {
        setStartLocation(`${startCoords.latitude}, ${startCoords.longitude}`);
      }
    } else if (userLocation && userLocation.coords) {
      startCoords = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude
      };
      if (!startLocation) {
        setStartLocation(`${startCoords.latitude}, ${startCoords.longitude}`);
      }
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK' && json.result.geometry) {
        const loc = json.result.geometry.location;
        const endCoords = { latitude: loc.lat, longitude: loc.lng };

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: loc.lat,
            longitude: loc.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          });
        }

        console.log("📍 Destination selected, fetching route...");
        // generateRoute(startCoords, endCoords); <--- OLD
        traceRoute(startCoords, endCoords); // <--- NEW LINK
      }
    } catch (e) {
      console.log("Place Details error:", e);
    }
  };


  // --- LOGIC: ROUTING ---

  const generateRoute = useCallback(async (manualStartCoords?: any, manualEndCoords?: any) => {
    // If manual coords not provided, check string inputs
    if ((!manualStartCoords && !startLocation) || (!manualEndCoords && !endLocation)) {
      Alert.alert('Error', 'Please enter both start and end locations');
      return;
    }

    setIsLoading(true);

    let start = manualStartCoords;
    if (!start) {
      start = await geocodeAddress(startLocation);
    }

    let end = manualEndCoords;
    if (!end) {
      end = await geocodeAddress(endLocation);
    }

    if (!start || !end) {
      Alert.alert('Error', 'Could not find one or both locations.');
      setIsLoading(false);
      return;
    }

    try {
      const mode = 'driving';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=${mode}&alternatives=true`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== 'OK' || !json.routes) {
        Alert.alert('Route Error', 'Could not find a route.');
        setIsLoading(false);
        return;
      }

      console.log(`🛣️ ${json.routes.length} number of routes found`);

      const routes = json.routes;

      let processedRoutes = [];
      let maxScore = -1;
      let maxScoreIndex = 0;

      // Analyze all routes
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const points = decodePolyline(route.overview_polyline.points);
        const mappedPoints = points.map(point => ({
          latitude: point[0],
          longitude: point[1],
        }));

        const segments = await aiSafetyAnalyzer.analyzeRouteSegments(mappedPoints, false);
        const score = calculateAIOverallSafetyScore(segments);

        processedRoutes.push({
          route: route,
          points: mappedPoints,
          segments: segments,
          score: score,
          leg: route.legs[0]
        });

        if (score > maxScore) {
          maxScore = score;
          maxScoreIndex = i;
        }
      }

      setAnalyzedRoutes(processedRoutes);
      setSelectedRouteIndex(maxScoreIndex);

      // Set initial state to the best route
      const best = processedRoutes[maxScoreIndex];
      setRouteCoordinates(best.points);
      setNavigationSteps(best.route.legs[0].steps);
      setSelectedRouteLeg(best.route.legs[0]);
      setSafetySegments(best.segments);
      setOverallScore(best.score);
      setShowSaferAlternative(true);

      // --- NEW: Capture Safety Hotspots directly ---
      const hotspots: any[] = [];
      best.segments.forEach(seg => {
        if (seg.safetyFactors?.police) {
          hotspots.push({ ...seg.safetyFactors.police, type: 'police' });
        }
        if (seg.safetyFactors?.hospital) {
          hotspots.push({ ...seg.safetyFactors.hospital, type: 'hospital' });
        }
      });
      setSafetyHotspots(hotspots);
      console.log("🔥 Safety Hotspots Found:", hotspots.length);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(best.points, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }

    } catch (error) {
      console.error("Directions API error:", error);
      Alert.alert('Routing Error', 'Failed to fetch route.');
    }

    setIsLoading(false);
    setShowRouteInput(false);
  }, [startLocation, endLocation, mapRef.current]);

  // --- traceRoute (User Requested Implementation) ---
  const traceRoute = async (startLoc: any, destLoc: any) => {
    try {
      console.log("🔄 Fetching Routes...");
      setIsLoading(true);

      const mode = 'driving';
      // API Call with 'alternatives=true'
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc.latitude},${startLoc.longitude}&destination=${destLoc.latitude},${destLoc.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=${mode}&alternatives=true`;

      const resp = await fetch(url);
      const result = await resp.json();

      if (result.routes && result.routes.length > 0) {
        console.log(`🛣️ ${result.routes.length} Routes Found!`);

        // 1. Save all routes
        setAllRoutes(result.routes);
        setSelectedRouteIndex(0); // Select first by default

        // Process for visualization (Decode polylines)
        const processedRoutes = [];
        for (let i = 0; i < result.routes.length; i++) {
          const route = result.routes[i];
          const points = decodePolyline(route.overview_polyline.points);
          const mappedPoints = points.map(p => ({ latitude: p[0], longitude: p[1] }));

          // Analyze safety (Keep existing powerful logic)
          const segments = await aiSafetyAnalyzer.analyzeRouteSegments(mappedPoints, false);
          const score = calculateAIOverallSafetyScore(segments);

          processedRoutes.push({
            route: route,
            points: mappedPoints,
            segments: segments,
            score: score,
            leg: route.legs[0]
          });
        }
        setAnalyzedRoutes(processedRoutes);

        // 2. Safety Markers Search (Near Destination)
        // Using existing searchNearbyPlaces logic from aiSafetyAnalyzer/placesService
        // We'll use the destination coordinates from destLoc

        // Note: We need to import searchNearbyPlaces or use the service. 
        // Since we have aiSafetyAnalyzer, let's use its robust logic or call service directly if imported.
        // For simplicity requested:
        try {
          // Import service to fetch places
          const placesService = await import('../services/placesService');

          // Improved Logic: Multi-Point Search (Start, Middle, End)
          const routePoints = processedRoutes[0].points;
          const searchPoints = [];

          if (routePoints.length > 0) {
            // 1. Start
            searchPoints.push(routePoints[0]);
            // 2. Middle
            searchPoints.push(routePoints[Math.floor(routePoints.length / 2)]);
            // 3. End
            searchPoints.push(routePoints[routePoints.length - 1]);
          } else {
            // Fallback to dest if no points (unlikely)
            searchPoints.push(destLoc);
          }

          console.log(`🔍 Searching safety spots at ${searchPoints.length} route points...`);

          // Parallel Fetch for ALL points
          const searchPromises = searchPoints.flatMap(pt => [
            placesService.searchNearbyPlaces(pt.latitude, pt.longitude, 'police', 3000),
            placesService.searchNearbyPlaces(pt.latitude, pt.longitude, 'hospital', 3000)
          ]);

          const results = await Promise.all(searchPromises);

          // Flatten results
          const allFound = results.flat();

          const combinedRaw = allFound.map((item: any) => {
            // Basic type inference if not explicit
            // (Depends on real response structure, 'types' usually array)
            // We'll trust the explicit search type for now or inferred mapping 
            // Note: searchNearbyPlaces usually returns typed objects or just raw. 
            // Let's assume we need to tag them based on what call it was? 
            // Actually, the result objects likely have 'types' or we rely on the loop.
            // But simplest way since we flatMapped:
            // We can't easily distinguish source call type in flat().
            // However, our previous logic manually mapped type.
            // Let's rely on the object's own categorization or add type if missing.
            // IMPROVEMENT: map types during the promise creation if needed, 
            // but usually 'searchNearbyPlaces' result has types.
            // Let's just flatten effectively.
            // For robustness: we'll try to guess type from 'types' array if present, else default.
            let type = 'hospital';
            if (item.types && item.types.includes('police')) type = 'police';

            return { ...item, type };
          });

          // Deduplicate based on name or location closeness
          const uniqueMarkersMap = new Map();
          combinedRaw.forEach(m => {
            const key = m.id || `${m.displayName?.text || m.name}-${m.location?.latitude?.toFixed(3)}`;
            if (!uniqueMarkersMap.has(key)) {
              uniqueMarkersMap.set(key, m);
            }
          });
          const rawMarkers = Array.from(uniqueMarkersMap.values());

          // Explicitly Map Coordinates for Rendering
          const cleanMarkers = rawMarkers.map(m => {
            // Handle various Google Places API response structures
            const lat = Number(m.geometry?.location?.lat || m.location?.latitude || m.location?.lat || m.latitude);
            const lng = Number(m.geometry?.location?.lng || m.location?.longitude || m.location?.lng || m.longitude);

            return {
              coordinate: {
                latitude: lat,
                longitude: lng
              },
              title: m.displayName?.text || m.name || "Safe Haven",
              type: m.type,
              originalLocation: m.geometry?.location || m.location,
              user_ratings_total: m.user_ratings_total
            };
          }).slice(0, 20); // UPDATED LIMIT: Max 20 markers


          // Log 1: On Data Fetch
          const hospitals = cleanMarkers.filter(m => m.type === 'hospital');
          const police = cleanMarkers.filter(m => m.type === 'police');
          console.log("📥 Raw Data Loaded - Hospitals:", hospitals.length, "Police:", police.length);
          if (hospitals.length > 0) {
            console.log("🕵️ Data Sample Check:", hospitals[0]?.title, "Reviews:", hospitals[0]?.user_ratings_total || 0);
          }

          setAllSafetyMarkers(cleanMarkers);
          setSafetyHotspots(cleanMarkers);
        } catch (err) {
          console.log("Safety search error:", err);
        }

        // 3. Set Navigation Data
        const leg = result.routes[0].legs[0];
        setNavStats({
          duration: leg.duration.text,
          distance: leg.distance.text,
          arrivalTime: "Calculating..."
        });

        // Set Map State
        const best = processedRoutes[0];
        setRouteCoordinates(best.points);
        setNavigationSteps(best.route.legs[0].steps);
        setSelectedRouteLeg(best.route.legs[0]);
        setSafetySegments(best.segments);
        setOverallScore(best.score);
        setShowSaferAlternative(true);

        if (mapRef.current) {
          mapRef.current.fitToCoordinates(best.points, {
            edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
            animated: true,
          });
        }

      } else {
        console.log("❌ No routes found.");
        Alert.alert('Error', 'No routes found');
      }
    } catch (error) {
      console.error("Error tracing route:", error);
      Alert.alert('Error', 'Route tracing failed');
    } finally {
      setIsLoading(false);
      setShowRouteInput(false);
    }
  };

  // --- LOD LOGIC ---
  const handleRegionChange = (newRegion: any) => {
    setRegion(newRegion);

    // Zoom Detection (Threshold 0.05)
    const zoomedOut = newRegion.latitudeDelta > 0.05;
    if (zoomedOut !== isZoomedOut) {
      setIsZoomedOut(zoomedOut);
    }

    // Log 2: On Region Change
    // Debouncing log slightly to avoid spam or just accept it as per request
    console.log("🗺️ Map Moved. Delta:", newRegion.latitudeDelta.toFixed(4), "Mode:", zoomedOut ? "CITY (Filtered)" : "STREET (Show All)");
  };

  // Filter Logic Effect
  useEffect(() => {
    let filtered = allSafetyMarkers.filter(m => {
      // 1. CRITICAL: Police always show if toggle is ON (Ignore Zoom/Ratings)
      if (m.type === 'police') {
        return showPolice;
      }

      // 2. Toggles Check (Hospitals)
      if (m.type === 'hospital' && !showHospitals) return false;

      // 3. Zoom/Quality Check (Hospitals only)
      if (isZoomedOut) {
        // CITY MODE: Show only popular places (> 50 reviews)
        const ratingCount = m.user_ratings_total || 0;
        if (ratingCount <= 50) return false;
      }

      return true;
    });

    // Log 3: Inside Filtering
    const visiblePolice = filtered.filter(m => m.type === 'police');
    console.log("⚡ Filtering Applied. Visible Markers:", filtered.length, "ZoomedOut:", isZoomedOut);
    console.log("👮 Visible Police Count:", visiblePolice.length);

    setVisibleSafetyMarkers(filtered);

  }, [allSafetyMarkers, isZoomedOut, showPolice, showHospitals]);

  // WRAPPERS to link old UI to new logic
  // Renaming generateRoute to call traceRoute internally if we want to switch completely, 
  // or just replacing generateRoute usage with traceRoute in handleSelectPlace.



  // --- LOGIC: NAVIGATION & TRACKING ---

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const calculateBearing = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const x = Math.sin(Δλ) * Math.cos(φ2);
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(x, y);
    return (θ * 180 / Math.PI + 360) % 360;
  }, []);

  // Find closest point on route to a given location
  const findClosestCoordinate = (target: { latitude: number, longitude: number }, routePoints: any[]) => {
    let minDist = Infinity;
    let closestRef = target; // Default to target itself if no points

    for (const p of routePoints) {
      const d = calculateDistance(target.latitude, target.longitude, p.latitude, p.longitude);
      if (d < minDist) {
        minDist = d;
        closestRef = p;
      }
    }
    return closestRef;
  };



  const handleReroute = (targetLocation: any) => {
    Alert.alert(
      "Emergency Reroute",
      "Rerouting to nearest safety haven...",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Now", onPress: () => {
            // Trigger reroute from current user location to this target
            generateRoute(null, targetLocation);
          }
        }
      ]
    );
  };

  const startNavigation = useCallback(() => {
    if (routeCoordinates.length > 0) {
      if (navigationSteps.length === 0) {
        Alert.alert('Error', 'No navigation steps available.');
        return;
      }
      try {
        setCurrentStepIndex(0);
        setIsNavigating(true);

        const totalDurationSeconds = navigationSteps.reduce((sum, step) => sum + step.duration.value, 0);
        setEstimatedTime(Math.ceil(totalDurationSeconds / 60));

        // Calculate Real Stats
        if (selectedRouteLeg) {
          const now = new Date();
          now.setSeconds(now.getSeconds() + selectedRouteLeg.duration.value);
          const eta = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setNavStats({
            duration: selectedRouteLeg.duration.text,
            distance: selectedRouteLeg.distance.text,
            arrivalTime: eta
          });
        }

        setShowRouteInput(false);
        setShowSaferAlternative(false);

        (async () => {
          locationWatcher.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 10,
            },
            (newLocation) => {
              setUserLocation(newLocation);
            }
          );
        })();

        if (mapRef.current) {
          mapRef.current.animateCamera({
            center: routeCoordinates[0],
            zoom: 18,
            heading: 0,
            pitch: 45,
          });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to start navigation.');
      }
    }
  }, [routeCoordinates, navigationSteps]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsOffRoute(false);
    setCurrentStepIndex(0);
    setDistanceToNext(0);
    setEstimatedTime(0);
    setUserLocation(null);

    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }

    setRouteCoordinates([]);
    setSafetySegments([]);
    setOverallScore(0);
    setShowSaferAlternative(false);
    setNavigationSteps([]);
    setStartLocation('');
    setEndLocation('');
  }, []);

  const handleRecenter = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else {
      Alert.alert("Location not found", "Wait for location to lock on.");
    }
  }, [userLocation]);

  const handleRecenterNav = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: userLocation.coords,
        pitch: 50, // Restore 3D tilt
        heading: userLocation.coords.heading || 0,
        zoom: 18,
      }, { duration: 1000 });
    }
  }, [userLocation]);

  const handleRouteSelect = (index: number) => {
    if (index === selectedRouteIndex) return;

    setSelectedRouteIndex(index);
    const selected = analyzedRoutes[index];

    setRouteCoordinates(selected.points);
    setNavigationSteps(selected.route.legs[0].steps);
    setSelectedRouteLeg(selected.leg);
    setSafetySegments(selected.segments);
    setOverallScore(selected.score);

    // Update camera to fit new route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(selected.points, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  };

  // --- LOGIC: SAFETY INTEL AGGREGATION ---
  const safetyIntel = useMemo(() => {
    let police = null;
    let hospital = null;
    // Iterate through segments to find key intel
    // We prioritize the info from the START or END of the route, or the first valid one found.
    for (const segment of safetySegments) {
      if (!police && segment.safetyFactors?.police) police = segment.safetyFactors.police;
      if (!hospital && segment.safetyFactors?.hospital) hospital = segment.safetyFactors.hospital;
      if (police && hospital) break;
    }
    return { police, hospital };
  }, [safetySegments]);

  // Live Navigation Effect
  useEffect(() => {
    if (!isNavigating || !userLocation || navigationSteps.length === 0) return;

    const userCoords = userLocation.coords;

    // Follow user with pitched camera during navigation
    if (mapRef.current) {
      // NOTE: We rely on MapView props for following, but we can enforce pitch here if needed.
    }

    // Step Advancement
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

    if (distanceToTurn < 25) {
      if (currentStepIndex < navigationSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        Alert.alert('Arrived', 'You have reached your destination.');
        stopNavigation();
      }
    }
  }, [userLocation, isNavigating, navigationSteps]);


  // --- UI RENDERING (STEALTH LUXURY) ---

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 1. Map Layer */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        customMapStyle={mapCustomStyle}
        // Updated Nav Behavior
        showsUserLocation={!isGhostMode || isNavigating}
        followsUserLocation={isNavigating}
        showsCompass={!isNavigating}
        pitchEnabled={true}
        camera={isNavigating && userLocation ? {
          center: {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          pitch: 45,
          heading: userLocation.coords.heading || 0,
          altitude: 200, // Approximate for zoom level
          zoom: 18
        } : undefined}
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
        onRegionChangeComplete={handleRegionChange}
      >
        {/* 1. ROUTES (Unified Loop: Selected=Blue, Others=Grey) */}
        {analyzedRoutes.map((r, index) => (
          <Polyline
            key={`route-${index}`}
            coordinates={r.points}
            strokeColor={index === selectedRouteIndex ? "#007AFF" : "#B0B0B0"} // STRICTLY BLUE for selected
            strokeWidth={6}
            zIndex={index === selectedRouteIndex ? 10 : 1}
            tappable={true}
            onPress={() => handleRouteSelect(index)}
          />
        ))}

        {/* 2. SAFETY MARKERS (LOD Filtered) */}
        {visibleSafetyMarkers
          .slice(0, 20).map((marker, index) => (
            <Marker
              key={`safe-${index}`}
              coordinate={marker.coordinate}
              title={marker.title || "Safe Spot"}
              tracksViewChanges={true} // FORCE RENDER
              zIndex={100} // TOPMOST
              onCalloutPress={() => {
                // Trigger external navigation
                openMap(marker.coordinate.latitude, marker.coordinate.longitude, marker.title);
              }}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 30, // Optimized rounded look
                padding: 4, // REDUCED from 6
                borderWidth: 2,
                borderColor: marker.type === 'police' ? '#007AFF' : '#FF3B30',
                elevation: 10, // High Elevation for Android Visibility
                shadowColor: 'black',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 2 },
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ fontSize: 18 }}>
                  {marker.type === 'police' ? '👮‍♂️' : '🏥'}
                </Text>
              </View>

              <Callout tooltip>
                <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 8, width: 200 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{marker.title}</Text>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                    {marker.type === 'police' ? '👮 Police Station' : '🏥 Hospital'}
                  </Text>
                  {/* Rating Info */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>⭐</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                      {marker.rating || 'N/A'} ({marker.user_ratings_total || 0})
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: 'blue', marginTop: 5, fontWeight: 'bold' }}>
                    Tap to Navigate ➔
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}

        {/* Custom Navigation Marker */}
        {isNavigating && userLocation && (
          <Marker
            coordinate={userLocation.coords}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={userLocation.coords.heading || 0}
            flat
          >
            <View style={styles.puckContainer}>
              <View style={styles.puckGlow} />
              <View style={styles.puckCore} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* 2. Ghost Mode Blur Overlay */}
      {isGhostMode && (
        <BlurView
          intensity={40}
          tint="dark"
          style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
        />
      )}

      {/* 3. Top Control Bar (Search & Ghost Toggle) */}
      <View style={[styles.topBar, { zIndex: 100 }]}>
        <BlurView intensity={20} tint="dark" style={styles.searchBar}>
          <View style={styles.searchPlaceholder}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.inlineSearchInput}
              placeholder="Where to safely?"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={endLocation}
              onChangeText={fetchSuggestions}
            />
            {endLocation.length > 0 && (
              <TouchableOpacity onPress={() => { setEndLocation(''); setSuggestions([]); }}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>

        {/* Ghost Mode Toggle */}
        <BlurView intensity={20} tint="dark" style={styles.ghostToggle}>
          <Text style={styles.ghostIcon}>👻</Text>
          <Switch
            value={isGhostMode}
            onValueChange={setIsGhostMode}
            trackColor={{ false: '#333', true: 'rgba(127, 0, 255, 0.5)' }}
            thumbColor={isGhostMode ? '#7F00FF' : '#f4f3f4'}
          />
        </BlurView>
      </View>

      {/* 4. Safety Filter Toggles (Responsive Position) */}
      <View style={isNavigating ? {
        // Nav Mode: Right Side Vertical Stack
        position: 'absolute',
        top: 280, // FINALLY LOWERED to avoid instructions
        right: 20,
        zIndex: 10,
        flexDirection: 'column', // Vertical
        gap: 12,
        alignItems: 'flex-end'
      } : {
        // Default Mode: Top Center Horizontal
        position: 'absolute',
        top: 130,
        left: 0,
        right: 0,
        zIndex: 90,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12
      }}>
        {/* Police Toggle */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: showPolice ? '#007AFF' : '#E0E0E0',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: showPolice ? '#007AFF' : '#B0B0B0',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 2 },
            elevation: 5
          }}
          onPress={() => setShowPolice(!showPolice)}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>👮‍♂️</Text>
          <Text style={{ color: showPolice ? 'white' : '#333', fontSize: 13, fontWeight: '700' }}>Police</Text>
        </TouchableOpacity>

        {/* Hospital Toggle */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: showHospitals ? '#FF3B30' : '#E0E0E0',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: showHospitals ? '#FF3B30' : '#B0B0B0',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 2 },
            elevation: 5
          }}
          onPress={() => setShowHospitals(!showHospitals)}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>🏥</Text>
          <Text style={{ color: showHospitals ? 'white' : '#333', fontSize: 13, fontWeight: '700' }}>Hospital</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Suggestions List (Below Header) */}
      {
        suggestions.length > 0 && !isNavigating && (
          <View style={styles.headerSuggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectPlace(item.place_id, item.description)}
                >
                  <MapPin size={16} color="#666" style={{ marginRight: 10 }} />
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={{ maxHeight: 200 }}
            />
          </View>
        )
      }

      {/* 4. Floating HUD (Bottom) */}
      {
        !isNavigating && !showRouteInput && (
          <Animated.View entering={SlideInUp.delay(500)} style={[styles.hudContainer, { zIndex: 20 }]}>
            <BlurView intensity={30} tint="dark" style={styles.hudGlass}>
              <View style={styles.hudRow}>
                <View style={styles.hudInfo}>
                  <Text style={styles.hudLabel}>CURRENT LOCATION</Text>
                  <Text style={styles.hudValue} numberOfLines={1}>{currentAddressLabel}</Text>
                </View>
                <View style={[styles.hudStatus, isGhostMode ? styles.statusGhost : styles.statusActive]}>
                  <View style={[styles.statusDot, { backgroundColor: isGhostMode ? '#A855F7' : '#00F0FF' }]} />
                  <Text style={[styles.statusText, { color: isGhostMode ? '#A855F7' : '#00F0FF' }]}>
                    {isGhostMode ? 'GHOST MODE' : 'MONITORING'}
                  </Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )
      }

      {/* 5. Navigation Instructions HUD (Redesigned) */}
      {
        isNavigating && (
          <>
            {/* A. Top Direction Banner */}
            <Animated.View entering={SlideInUp} style={styles.navTopBanner}>
              <View style={styles.turnIconBox}>
                <Ionicons name="arrow-undo" size={32} color="#FFF" />
              </View>
              <View style={styles.turnTextBox}>
                <Text style={styles.turnInstruction}>Turn Left onto Sector 29 Road</Text>
                <Text style={styles.turnSubtext}>in 150 meters</Text>
              </View>
            </Animated.View>

            {/* B. Bottom Info Card */}
            <Animated.View entering={FadeInDown} style={styles.navBottomCard}>
              <View style={styles.navStatsRow}>
                <View>
                  <Text style={styles.navTime}>{navStats.duration || '0 min'}</Text>
                  <Text style={styles.navMetaText}>
                    {navStats.distance || '0 km'} • ETA: {navStats.arrivalTime || '--:--'}
                  </Text>
                </View>
                <TouchableOpacity onPress={stopNavigation} style={styles.navExitBtn}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* C. Navigation Recenter Button */}
            <TouchableOpacity onPress={handleRecenterNav} style={styles.navRecenterBtn}>
              <Navigation size={24} color="#007AFF" />
            </TouchableOpacity>
          </>
        )
      }

      {/* 8. Recenter Button */}
      {
        !isNavigating && !showRouteInput && (
          <TouchableOpacity onPress={handleRecenter} style={styles.recenterBtn}>
            <Target size={24} color="#000" />
          </TouchableOpacity>
        )
      }

      {/* 6. Route Planning Modal */}
      <Modal
        visible={showRouteInput}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRouteInput(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalGlassCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SECURE ROUTE</Text>
              <TouchableOpacity onPress={() => setShowRouteInput(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputStack}>
              <View style={styles.glassInputWrapper}>
                <Text style={styles.inputLabel}>START</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="Current Location"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={startLocation}
                  onChangeText={setStartLocation}
                />
                <TouchableOpacity onPress={useCurrentLocation}>
                  <Text>📍</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.glassInputWrapper}>
                <Text style={styles.inputLabel}>END</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="Destination"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={endLocation}
                  onChangeText={fetchSuggestions}
                />
              </View>

              {/* Autocomplete Suggestions List */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelectPlace(item.place_id, item.description)}
                      >
                        <MapPin size={16} color="#666" style={{ marginRight: 10 }} />
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    style={{ maxHeight: 200 }}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity onPress={generateRoute} style={styles.actionBtn}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>ANALYZE SAFETY</Text>}
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* 7. Route Preview / Safety Card */}
      {
        showSaferAlternative && !showRouteInput && !isNavigating && (
          <Animated.View entering={FadeInDown} style={[styles.safetyCardWrapper, { zIndex: 25 }]}>
            <BlurView intensity={40} tint="dark" style={styles.safetyCard}>
              <View style={styles.safetyHeader}>
                <Text style={styles.safetyTitle}>Safety Assessment</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{Math.round(overallScore)}/100</Text>
                </View>
              </View>
              <Text style={styles.safetyDesc}>
                {overallScore > 80 ? "This route is verified safe." : "Proceed with caution."}
              </Text>

              {/* Safety Intel Section */}
              <View style={styles.intelContainer}>
                <Text style={styles.intelHeader}>SAFETY INTEL</Text>

                {safetyIntel.police ? (
                  <View style={styles.intelRow}>
                    <Text style={{ fontSize: 16 }}>👮</Text>
                    <Text style={[styles.intelText, { color: '#4ade80' }]}>
                      {safetyIntel.police.name} ({safetyIntel.police.distance})
                    </Text>
                  </View>
                ) : null}

                {safetyIntel.hospital ? (
                  <View style={styles.intelRow}>
                    <Text style={{ fontSize: 16 }}>🏥</Text>
                    <Text style={[styles.intelText, { color: '#f472b6' }]}>
                      {safetyIntel.hospital.name} ({safetyIntel.hospital.distance})
                    </Text>
                  </View>
                ) : null}

                {!safetyIntel.police && !safetyIntel.hospital && (
                  <Text style={[styles.intelText, { color: '#fbbf24' }]}>⚠️ No immediate services nearby</Text>
                )}
              </View>
              <TouchableOpacity onPress={startNavigation} style={styles.startNavBtn}>
                <Text style={styles.startNavText}>START NAVIGATION</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )
      }

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  inlineSearchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    height: '100%',
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  searchText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  ghostToggle: {
    width: 80,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  ghostIcon: {
    fontSize: 18,
  },

  // HUD
  hudContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  hudGlass: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudInfo: {
    flex: 1,
    marginRight: 15, // Add spacing between text and status badge
  },
  hudLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hudValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 200,
  },
  hudStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  statusGhost: {
    backgroundColor: 'rgba(127, 0, 255, 0.1)',
    borderColor: 'rgba(127, 0, 255, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalGlassCard: {
    width: width - 40,
    padding: 24,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Intel Styles
  intelContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  intelHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  intelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  intelText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  }
  ,
  closeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
  },
  inputStack: {
    marginBottom: 20,
    gap: 15,
  },
  glassInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
    position: 'absolute',
    top: 5,
    left: 15,
  },
  glassInput: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Navigation Overlay
  navOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  navGlassPanel: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  navInstruction: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  navMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  // Navigation Redesign Styles
  navTopBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF', // Professional Navigation Blue
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  turnIconBox: {
    marginRight: 15,
  },
  turnTextBox: {
    flex: 1,
  },
  turnInstruction: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  turnSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },

  navBottomCard: {
    position: 'absolute',
    bottom: 90, // Raised above floating tab bar
    left: 20,
    right: 20,
    marginHorizontal: 0, // Already handled by left/right: 20
    backgroundColor: '#FFFFFF', // White Card
    borderRadius: 20, // Full rounded corners for floating look
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  navStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTime: {
    color: '#0F9D58', // Green Text
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  navMetaText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  navExitBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444', // Red Exir
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Safety Card
  safetyCardWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  safetyCard: {
    padding: 20,
    backgroundColor: 'rgba(20,20,20,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  safetyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreBadge: {
    backgroundColor: 'rgba(0,255,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  scoreText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  safetyDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 15,
  },
  startNavBtn: {
    backgroundColor: '#7F00FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  startNavText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Navigation Puck
  puckContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puckGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  puckCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  markerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  markerText: {
    color: '#00F0FF',
    fontWeight: '800',
  },

  // Recenter Button
  recenterBtn: {
    position: 'absolute',
    bottom: 180,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 90,
  },

  navRecenterBtn: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },

  // Autocomplete Styles
  suggestionsContainer: {
    position: 'absolute',
    top: 130, // Adjust based on input stack height
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginTop: 5,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  headerSuggestionsContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    elevation: 20,
    zIndex: 2000,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  // --- SAFETY MARKERS ---
  safetyMarkerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    marginBottom: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
    color: '#000'
  },
  calloutSub: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  calloutBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },

});
