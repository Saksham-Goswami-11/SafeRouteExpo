import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
  ActionSheetIOS,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { auth } from '../services/firebaseClient';
import { Copy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { useSOS } from '../context/SOSContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ProfileStackParamList, RootTabParamList } from '../navigation/types';
import { RootStackParamList } from '../../App';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  StackNavigationProp<ProfileStackParamList & RootStackParamList>
>;

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { colors, darkMode, setDarkMode } = useTheme();
  const { user, profile, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const { shakeEnabled, setShakeEnabled } = useSOS();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [ghostMode, setGhostMode] = useState(false);

  // Animations
  const shieldRotation = useSharedValue(0);

  useEffect(() => {
    shieldRotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedShieldStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shieldRotation.value}deg` }],
  }));

  const onEditProfile = () => navigation.navigate('EditProfile');
  const onManageContacts = () => navigation.navigate('EmergencyContacts');
  const onPrivacy = () => Alert.alert('Privacy & Security', 'Navigate to privacy settings.');
  const onLogout = async () => { await logout(); };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is needed to select photos.');
      return;
    }
    // ... existing logic simplified for brevity but kept functional ...
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleCopyID = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await Clipboard.setStringAsync(uid);
      Alert.alert("Safety ID Copied!", "Share this ID with your Guardian so they can track you.");
    }
  };

  const InfoTile = ({ label, value, icon }: any) => (
    <BlurView intensity={20} tint="dark" style={styles.infoTile}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </BlurView>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#050505', '#1a0b2e', '#000000']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(127, 0, 255, 0.1)', 'transparent']} style={[StyleSheet.absoluteFill, { top: -200 }]} />

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarInner, { borderColor: '#7F00FF' }]}>
                <Text style={{ fontSize: 40 }}>🔒</Text>
              </View>
            </View>
            <Text style={[styles.userName, { textAlign: 'center' }]}>Guest Access</Text>
            <Text style={[styles.userHandle, { textAlign: 'center', marginTop: 10, maxWidth: 300 }]}>
              Log in to sync your safety data, manage trusted contacts, and enable ghost mode.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ width: '100%', gap: 15 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutBtn}>
              <LinearGradient colors={['#7F00FF', '#E100FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
              <Text style={[styles.logoutText, { color: '#FFF' }]}>LOG IN</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={[styles.logoutBtn, { borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.logoutText, { color: '#FFF' }]}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#050505', '#1a0b2e', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Aurora */}
      <LinearGradient
        colors={['rgba(0, 240, 255, 0.1)', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: -300, transform: [{ scaleX: 1.5 }] }]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Header with Holographic Shield */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {/* Rotating Shield Ring */}
            <Animated.View style={[styles.shieldRing, animatedShieldStyle]}>
              <LinearGradient
                colors={['transparent', '#00F0FF', 'transparent']}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Static Inner Glow */}
            <View style={styles.avatarGlow} />

            {/* Avatar Image */}
            <View style={styles.avatarInner}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={{ fontSize: 40 }}>👤</Text>
              )}
            </View>

            <View style={styles.editBadge}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>EDIT</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{profile?.full_name || user?.email || 'Guest User'}</Text>
          <Text style={styles.userHandle}>@{profile?.full_name?.replace(' ', '').toLowerCase() || 'explorer'}</Text>

          {/* Safety ID Pill */}
          {user && (
            <TouchableOpacity style={styles.idPill} onPress={handleCopyID}>
              <Text style={styles.idLabel}>ID:</Text>
              <Text style={styles.idText}>{auth.currentUser?.uid?.substring(0, 8)}...</Text>
              <Copy size={12} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <InfoTile label="Safety Score" value="98%" icon="🛡️" />
          <InfoTile label=" Protected" value="24h" icon="⏱️" />
          <InfoTile label="Contacts" value="3" icon="👥" />
        </Animated.View>

        {/* Ghost Mode Toggle */}
        <BlurView intensity={20} tint="dark" style={styles.ghostModeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ghostTitle}>Ghost Mode</Text>
            <Text style={styles.ghostSubtitle}>Go unseen on the map immediately.</Text>
          </View>
          <Switch
            value={ghostMode}
            onValueChange={setGhostMode}
            trackColor={{ false: '#333', true: 'rgba(0, 240, 255, 0.3)' }}
            thumbColor={ghostMode ? '#00F0FF' : '#f4f3f4'}
          />
        </BlurView>

        {/* Settings Groups */}
        <BlurView intensity={30} tint="dark" style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#333', true: 'rgba(127, 0, 255, 0.4)' }}
              thumbColor={notificationsEnabled ? '#7F00FF' : '#f4f3f4'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Shake to SOS</Text>
            <Switch
              value={shakeEnabled}
              onValueChange={setShakeEnabled}
              trackColor={{ false: '#333', true: 'rgba(255, 45, 85, 0.4)' }}
              thumbColor={shakeEnabled ? '#FF2D55' : '#f4f3f4'}
            />
          </View>
        </BlurView>

        <BlurView intensity={30} tint="dark" style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Account</Text>

          <TouchableOpacity style={styles.actionRow} onPress={onManageContacts}>
            <Text style={styles.actionLabel}>Emergency Contacts</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('SavedAddresses')}>
            <Text style={styles.actionLabel}>Saved Locations</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AudioEvidence')}>
            <Text style={styles.actionLabel}>📂 Audio Evidence</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity onPress={() => navigation.navigate('Guardian')} style={styles.guardianBtn}>
          <Text style={styles.guardianText}>👮 SWITCH TO GUARDIAN MODE</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },

  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 120, height: 120,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 15,
  },
  shieldRing: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderStyle: 'dashed',
  },
  avatarGlow: {
    position: 'absolute',
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(127, 0, 255, 0.2)',
    shadowColor: '#7F00FF', shadowRadius: 20, shadowOpacity: 0.5,
  },
  avatarInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  avatarImage: { width: 100, height: 100 },
  editBadge: {
    position: 'absolute', bottom: 0,
    backgroundColor: '#00F0FF',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 4,
  },
  userName: { color: '#FFF', fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  userHandle: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  idPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  idLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginRight: 4, fontWeight: '600' },
  idText: { color: '#00F0FF', fontSize: 12, fontWeight: '700', marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  infoTile: {
    width: (width - 40) / 3 - 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  tileIcon: { fontSize: 20, marginBottom: 5 },
  tileValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  tileLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase' },

  ghostModeCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)',
    marginBottom: 20,
  },
  ghostTitle: { color: '#00F0FF', fontSize: 18, fontWeight: 'bold' },
  ghostSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  sectionCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    padding: 15,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15,
  },
  settingLabel: { color: '#FFF', fontSize: 16 },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15,
  },
  actionLabel: { color: '#FFF', fontSize: 16 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 15 },

  logoutBtn: {
    alignItems: 'center', padding: 15,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 45, 85, 0.3)',
  },
  logoutText: { color: '#FF2D55', fontWeight: 'bold', letterSpacing: 1 },

  guardianBtn: {
    alignItems: 'center', padding: 15,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 10,
  },
  guardianText: { color: '#3b82f6', fontWeight: 'bold', letterSpacing: 1 },
});
