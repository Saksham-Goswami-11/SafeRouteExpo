import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import * as Location from 'expo-location';
const { width, height } = Dimensions.get('window');

interface SafetyTip {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'personal' | 'travel' | 'emergency';
}

const safetyTips: SafetyTip[] = [
  {
    id: '1',
    icon: '🌙',
    title: 'Night Travel Safety',
    description: 'Stick to well-lit areas and inform someone of your route',
    category: 'travel'
  },
  {
    id: '2',
    icon: '👥',
    title: 'Travel in Groups',
    description: 'When possible, travel with friends or in groups',
    category: 'travel'
  },
  {
    id: '3',
    icon: '📱',
    title: 'Share Your Location',
    description: 'Let trusted contacts know your whereabouts',
    category: 'personal'
  },
  {
    id: '4',
    icon: '🚨',
    title: 'Emergency Contacts',
    description: 'Keep emergency numbers easily accessible',
    category: 'emergency'
  },
  {
    id: '5',
    icon: '👀',
    title: 'Stay Aware',
    description: 'Be alert of your surroundings and trust your instincts',
    category: 'personal'
  },
  {
    id: '6',
    icon: '🛣️',
    title: 'Choose Safe Routes',
    description: 'Use well-traveled roads and avoid isolated areas',
    category: 'travel'
  }
];

export default function SafetyScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { enabled: sosEnabled } = useSOS();
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [areaRating, setAreaRating] = useState(85);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const styles = makeStyles(colors);
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
        
        // Simulate area safety rating based on location (using dummy data)
        const rating = Math.floor(Math.random() * 30) + 70; // Random rating between 70-100
        setAreaRating(rating);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const callEmergency = () => {
    const emergencyNumber = Platform.OS === 'ios' ? 'tel://911' : 'tel:911';
    Linking.canOpenURL(emergencyNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emergencyNumber);
        } else {
          Alert.alert('Error', 'Unable to make emergency call');
        }
      })
      .catch(() => Alert.alert('Error', 'Unable to make emergency call'));
  };

  const shareLocationWithContacts = async () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to share your location');
      return;
    }

    const message = `I'm sharing my current location with you for safety: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open WhatsApp. Please ensure it\'s installed.');
    }
  };

  const filteredTips = selectedCategory === 'all' 
    ? safetyTips 
    : safetyTips.filter(tip => tip.category === selectedCategory);

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return colors.safe;
    if (rating >= 60) return colors.warning;
    return colors.danger;
  };

  const getRatingText = (rating: number) => {
    if (rating >= 80) return '✅ Safe Area';
    if (rating >= 60) return '⚠️ Moderate Risk';
    return '🚨 High Risk Area';
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Safety Center</Text>
          <Text style={styles.headerSubtitle}>Stay safe with real-time insights & emergency tools</Text>
        </View>

        {/* Current Area Safety */}
        <View style={styles.card}>
          <LinearGradient
            colors={[colors.backgroundCard, colors.backgroundLight]}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>Current Area Safety</Text>
            <View style={styles.safetyRatingContainer}>
              <View style={styles.ratingCircle}>
                <Text style={[styles.ratingNumber, { color: getRatingColor(areaRating) }]}>
                  {areaRating}
                </Text>
                <Text style={styles.ratingMax}>/100</Text>
              </View>
              <View style={styles.ratingInfo}>
                <Text style={[styles.ratingStatus, { color: getRatingColor(areaRating) }]}>
                  {getRatingText(areaRating)}
                </Text>
                <Text style={styles.locationText}>
                  {currentLocation ? 'Location detected' : 'Getting location...'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Emergency Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          <View style={styles.emergencyActions}>
            <TouchableOpacity style={styles.emergencyButton} onPress={callEmergency}>
              <LinearGradient
                colors={[colors.danger, colors.accent]}
                style={styles.emergencyGradient}
              >
                <Text style={styles.emergencyIcon}>🚨</Text>
                <Text style={styles.emergencyText}>Call 911</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyButton} onPress={shareLocationWithContacts}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.emergencyGradient}
              >
                <Text style={styles.emergencyIcon}>📍</Text>
                <Text style={styles.emergencyText}>Share Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {sosEnabled && (
            <View style={styles.sosStatus}>
              <Text style={styles.sosIcon}>🤝</Text>
              <Text style={styles.sosText}>SOS Shake Detection Active</Text>
            </View>
          )}

        </View>

        {/* Safety Tips */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          
          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {[
              { key: 'all', label: 'All', icon: '📋' },
              { key: 'personal', label: 'Personal', icon: '👤' },
              { key: 'travel', label: 'Travel', icon: '🚗' },
              { key: 'emergency', label: 'Emergency', icon: '🚨' }
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === category.key && styles.categoryLabelActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tips List */}
          <View style={styles.tipsList}>
            {filteredTips.map((tip) => (
              <View key={tip.id} style={styles.tipItem}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Resources */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety Resources</Text>
          <View style={styles.resourcesList}>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>📖</Text>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Safety Guidelines</Text>
                <Text style={styles.resourceSubtitle}>Complete safety handbook</Text>
              </View>
              <Text style={styles.resourceArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>🏥</Text>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Nearby Hospitals</Text>
                <Text style={styles.resourceSubtitle}>Find medical help nearby</Text>
              </View>
              <Text style={styles.resourceArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>👮</Text>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Police Stations</Text>
                <Text style={styles.resourceSubtitle}>Locate law enforcement</Text>
              </View>
              <Text style={styles.resourceArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 15,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 15,
  },
  safetyRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  ratingMax: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingStatus: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emergencyActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  emergencyButton: {
    flex: 1,
  },
  emergencyGradient: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emergencyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sosStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.safe + '20',
    borderRadius: 12,
    padding: 12,
  },
  sosIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sosText: {
    color: colors.safe,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.primary,
  },
  tipsList: {
    gap: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background + '50',
    borderRadius: 12,
    padding: 15,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 15,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
});
