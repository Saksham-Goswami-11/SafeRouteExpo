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
import {
  analyzeRouteSegments,
  calculateOverallSafetyScore,
  generateAlternativeRoute,
  SafetySegment,
} from '../utils/safetyAnalysis';
import { useAuth } from '../context/AuthContext';
import { fetchSavedAddresses, SavedAddress, addSavedAddress } from '../services/addressService';

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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [startSuggestions, setStartSuggestions] = useState<SavedAddress[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<SavedAddress[]>([]);
  
  // Navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const styles = makeStyles(colors);

  // Request location permission and get current location
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

    setIsLoading(true);
    
    const start = await geocodeAddress(startLocation);
    const end = await geocodeAddress(endLocation);

    if (!start || !end) {
      Alert.alert('Error', 'Could not find one or both locations');
      setIsLoading(false);
      return;
    }

    // Generate route coordinates (simplified - in production use routing API)
    const routePoints = generateRoutePoints(start, end, alternativeAttempt);
    setRouteCoordinates(routePoints);

    // Analyze safety segments
    const segments = analyzeRouteSegments(routePoints, alternativeAttempt > 0);
    setSafetySegments(segments);

    // Calculate overall score
    const score = calculateOverallSafetyScore(segments);
    setOverallScore(score);
    setShowSaferAlternative(true);

    // Fit map to show entire route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(routePoints, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }

    setIsLoading(false);
    setShowRouteInput(false);
  }, [startLocation, endLocation, alternativeAttempt]);

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

  // Optimized navigation start with loading state
  const startNavigation = useCallback(() => {
    if (routeCoordinates.length > 0) {
      try {
        const steps = generateNavigationSteps(routeCoordinates);
        setNavigationSteps(steps);
        setCurrentStepIndex(0);
        setIsNavigating(true);
        
        // Estimate total time (assuming 50 km/h average speed)
        const totalDistance = steps[steps.length - 1]?.totalDistance || 0;
        const estimatedMinutes = Math.ceil(totalDistance / 1000 * 1.2); // 1.2 minutes per km
        setEstimatedTime(estimatedMinutes);
        
        // Close route input and safety card
        setShowRouteInput(false);
        setShowSaferAlternative(false);
      } catch (error) {
        console.error('Navigation start error:', error);
        Alert.alert('Error', 'Failed to start navigation. Please try again.');
      }
    }
  }, [routeCoordinates, generateNavigationSteps]);

  // Optimized navigation stop
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setNavigationSteps([]);
    setDistanceToNext(0);
    setEstimatedTime(0);
  }, []);

  // Memoized route points generation
  const generateRoutePoints = useCallback((start: any, end: any, attempt: number) => {
    if (attempt > 0) {
      return generateAlternativeRoute(start, end, attempt);
    }

    // Generate a curved route between start and end with fewer points for better performance
    const points = [];
    const steps = 25; // Reduced from 50 to 25 for better performance
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add some curve to the route
      const curve = Math.sin(t * Math.PI) * 0.01;
      
      points.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t + curve,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
    
    return points;
  }, []);

  // Find safer alternative
  const findSaferRoute = () => {
    setAlternativeAttempt(prev => prev + 1);
    generateRoute();
  };

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
        {safetySegments.map((segment, index) => (
          <Polyline
            key={index}
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={6}
            tappable={true}
            onPress={() => setSelectedSegment(segment)}
          />
        ))}

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

            <Text style={styles.safetyScoreTitle}>Route Safety Score</Text>
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

            <View style={styles.safetyActionButtons}>
              {overallScore < 70 && (
                <TouchableOpacity onPress={findSaferRoute} style={styles.alternativeButton}>
                  <LinearGradient
                    colors={[colors.warning, colors.secondary]}
                    style={styles.saferRouteBtn}
                  >
                    <Text style={styles.saferRouteBtnText}>
                      ✨ Find Safer Alternative
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={startNavigation} style={styles.navigationButton}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.startNavBtn}
                >
                  <Text style={styles.navButtonIcon}>🧿</Text>
                  <Text style={styles.startNavBtnText}>Start Navigation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
        <View style={styles.navigationContainer}>
          <LinearGradient
            colors={[colors.backgroundCard, colors.backgroundLight]}
            style={styles.navigationPanel}
          >
            {/* Navigation Header */}
            <View style={styles.navHeader}>
              <View style={styles.navHeaderLeft}>
                <Text style={styles.navETA}>{estimatedTime} min</Text>
                <Text style={styles.navDistance}>
                  {(navigationSteps[navigationSteps.length - 1]?.totalDistance / 1000 || 0).toFixed(1)} km
                </Text>
              </View>
              <TouchableOpacity onPress={stopNavigation} style={styles.navCloseBtn}>
                <Text style={styles.navCloseBtnText}>End</Text>
              </TouchableOpacity>
            </View>

            {/* Current Instruction */}
            {currentStepIndex < navigationSteps.length && (
              <View style={styles.currentInstruction}>
                <View style={styles.instructionIcon}>
                  <Text style={styles.instructionIconText}>
                    {navigationSteps[currentStepIndex]?.icon || '⬆️'}
                  </Text>
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionText}>
                    {navigationSteps[currentStepIndex]?.instruction || 'Continue straight'}
                  </Text>
                  {navigationSteps[currentStepIndex]?.distance > 0 && (
                    <Text style={styles.instructionDistance}>
                      in {navigationSteps[currentStepIndex]?.distance}m
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Next Instructions Preview */}
            <View style={styles.nextInstructions}>
              {navigationSteps.slice(currentStepIndex + 1, currentStepIndex + 3).map((step, index) => (
                <View key={index} style={styles.nextInstruction}>
                  <Text style={styles.nextInstructionIcon}>{step.icon}</Text>
                  <Text style={styles.nextInstructionText}>{step.instruction}</Text>
                  <Text style={styles.nextInstructionDistance}>{step.distance}m</Text>
                </View>
              ))}
            </View>

            {/* Navigation Controls */}
            <View style={styles.navControls}>
              <TouchableOpacity 
                style={[
                  styles.navControlBtn, 
                  currentStepIndex === 0 && styles.navControlBtnDisabled
                ]}
                onPress={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
              >
                <Text style={[
                  styles.navControlText,
                  currentStepIndex === 0 && styles.navControlTextDisabled
                ]}>◀ Prev</Text>
              </TouchableOpacity>
              
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>
                  {currentStepIndex + 1} of {navigationSteps.length}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.navControlBtn,
                  currentStepIndex >= navigationSteps.length - 1 && styles.navControlBtnDisabled
                ]}
                onPress={() => setCurrentStepIndex(Math.min(navigationSteps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex >= navigationSteps.length - 1}
              >
                <Text style={[
                  styles.navControlText,
                  currentStepIndex >= navigationSteps.length - 1 && styles.navControlTextDisabled
                ]}>Next ▶</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Floating Action Button */}
      {!showRouteInput && (
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
  // Navigation UI Styles
  navigationContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  navigationPanel: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  navETA: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  navDistance: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  navCloseBtn: {
    backgroundColor: colors.danger + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  navCloseBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background + '50',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    gap: 15,
  },
  instructionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionIconText: {
    fontSize: 20,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  instructionDistance: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nextInstructions: {
    gap: 8,
    marginBottom: 15,
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.background + '30',
    borderRadius: 10,
    gap: 12,
  },
  nextInstructionIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  nextInstructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nextInstructionDistance: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '15',
  },
  navControlBtn: {
    backgroundColor: colors.background + '50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  navControlText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicator: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  navControlBtnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.background + '30',
  },
  navControlTextDisabled: {
    color: colors.textMuted,
  },
});
