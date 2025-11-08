import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Assuming App.tsx exports this
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp } from '@react-navigation/native';

const SafetyScreen = () => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const navigateToNearby = (type: 'hospital' | 'police') => {
    navigation.navigate('NearbyPlaces', { type });
  };

  const callEmergency = () => {
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

  const safetyTips = [
    { key: '1', text: 'Be aware of your surroundings at all times.' },
    { key: '2', text: 'Share your live location with a trusted contact when traveling alone.' },
    { key: '3', text: 'Avoid poorly lit areas and shortcuts, especially at night.' },
    { key: '4', text: 'Keep your phone charged and accessible.' },
  ];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Safety Resources</Text>
        <Text style={styles.subtitle}>Find help and information quickly.</Text>
      </View>
      
      {/* Emergency Call Card */}
      <TouchableOpacity activeOpacity={0.8} style={styles.emergencyCard} onPress={callEmergency}>
        <LinearGradient
          colors={[colors.danger, colors.accent]}
          style={styles.emergencyGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View>
            <Text style={styles.emergencyTitle}>Call Emergency Services</Text>
            <Text style={styles.emergencySubtitle}>Tap here for immediate assistance</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Nearby Resources Card */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Find Help Nearby</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={() => navigateToNearby('hospital')}>
            <Text style={styles.buttonIcon}>🏥</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Nearby Hospitals</Text>
              <Text style={styles.buttonSubtitle}>Find the nearest medical centers</Text>
            </View>
            <Text style={styles.buttonArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.button} onPress={() => navigateToNearby('police')}>
            <Text style={styles.buttonIcon}>👮</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Nearby Police Stations</Text>
              <Text style={styles.buttonSubtitle}>Locate law enforcement offices</Text>
            </View>
            <Text style={styles.buttonArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Tips Card */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Safety Tips</Text>
        <View style={styles.card}>
          {safetyTips.map((tip, index) => (
            <View key={tip.key}>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
              {index < safetyTips.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: colors.background, paddingBottom: 40 },
    headerContainer: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    header: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary },
    sectionContainer: { marginHorizontal: 20, marginTop: 25 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 15 },
    card: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 20,
      padding: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
    },
    buttonIcon: { fontSize: 24, marginRight: 15 },
    buttonTextContainer: { flex: 1 },
    buttonTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    buttonSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
    buttonArrow: { fontSize: 22, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.background, marginHorizontal: 10 },
    emergencyCard: {
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 20,
      shadowColor: colors.danger,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 10,
    },
    emergencyGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 20,
    },
    emergencyIcon: {
      fontSize: 36,
      marginRight: 15,
    },
    emergencyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    emergencySubtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.8,
      marginTop: 4,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
    },
    tipIcon: {
      fontSize: 18,
      marginRight: 15,
    },
    tipText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });

export default SafetyScreen;