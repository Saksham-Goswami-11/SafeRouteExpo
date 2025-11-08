import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext'; // Path update karein
import { useRoute, RouteProp } from '@react-navigation/native';
import { searchNearbyPlaces, Place } from '../services/placesService';
import * as Location from 'expo-location';

// Define route params
type NearbyPlacesRouteParams = {
  NearbyPlaces: {
    type: 'hospital' | 'police';
  };
};

type NearbyPlacesRouteProp = RouteProp<NearbyPlacesRouteParams, 'NearbyPlaces'>;

export default function NearbyPlacesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]); // Memoized styles
  const route = useRoute<NearbyPlacesRouteProp>();
  
  const { type } = route.params;
  const title = type === 'hospital' ? 'Nearby Hospitals' : 'Nearby Police Stations';
  const icon = type === 'hospital' ? '🏥' : '👮';

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyPlaces();
  }, []);

  const fetchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // 2. Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 3. Call Google Places API
      const results = await searchNearbyPlaces(latitude, longitude, type);
      setPlaces(results);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API key is missing.') {
        setError('The application is not configured correctly. API key is missing.');
      } else {
        setError('Could not fetch nearby places. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to open location in Maps
  const openInMaps = (lat: number, lng: number, label: string) => {
    const scheme = Platform.OS === 'ios' ? 'maps://0,0?q=' : 'geo:0,0?q=';
    const location = `${lat},${lng}`;
    const url = `${scheme}${location}(${label})`;
    // ✅ NAYA (SAFE) CODE:
    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open maps application.'));
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            Showing nearest {type} locations within 5km
          </Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}

        {error && (
          <View style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.card}>
            <View style={styles.resourcesList}>
              {places.length > 0 ? (
                places.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.resourceItem}
                    onPress={() => openInMaps(place.location.latitude, place.location.longitude, place.displayName.text)}
                  >
                    <Text style={styles.resourceIcon}>{icon}</Text>
                    <View style={styles.resourceContent}>
                      <Text style={styles.resourceTitle}>{place.displayName.text}</Text>
                      <Text style={styles.resourceSubtitle}>{place.formattedAddress}</Text>
                    </View>
                    <Text style={styles.resourceArrow}>›</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.tipDescription}>
                  No {type} locations found nearby.
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// In styles ko SafetyScreen se copy kiya gaya hai "similar UI" ke liye
const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 25,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    loader: {
      marginTop: 50,
    },
    errorText: {
      color: colors.danger,
      fontSize: 16,
      textAlign: 'center',
    },
    resourcesList: {
      gap: 12,
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background + '30',
      borderRadius: 12,
      padding: 15,
    },
    resourceIcon: {
      fontSize: 20,
      marginRight: 15,
    },
    resourceContent: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    resourceSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    resourceArrow: {
      fontSize: 18,
      color: colors.textMuted,
    },
    tipDescription: { // Reusing style
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
  });