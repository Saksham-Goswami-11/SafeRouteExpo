import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { useSOS } from '../context/SOSContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ProfileStackParamList, RootTabParamList } from '../navigation/types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  StackNavigationProp<ProfileStackParamList>
>;

export default function ProfileScreen() {
  const { colors, darkMode, setDarkMode } = useTheme();
  const { user, profile, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const { shakeEnabled, setShakeEnabled } = useSOS();
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await takePhoto();
          } else if (buttonIndex === 2) {
            await selectFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Photo',
        'Choose how you want to select your profile photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: selectFromLibrary },
        ]
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const selectFromLibrary = async () => {
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

  const styles = makeStyles(colors);

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header / Banner */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Your account details & preferences</Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>You're not signed in</Text>
            <Text style={styles.prefSubtitle}>Log in or create an account to save addresses and manage contacts.</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => (navigation as any).navigate('Login')}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.primaryBtnGradient}>
                  <Text style={styles.primaryBtnText}>Log in</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => (navigation as any).navigate('Signup')}>
                <Text style={styles.secondaryBtnText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Card: Profile Summary */}
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                  <View style={styles.avatar}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>👤</Text>
                      </View>
                    )}
                    <View style={styles.cameraIcon}>
                      <Text style={styles.cameraText}>📷</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{profile?.full_name || user.email}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: colors.safe }]}> 
                      <Text style={[styles.badgeText, { color: colors.safe }]}>Verified</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: colors.primary }]}> 
                      <Text style={[styles.badgeText, { color: colors.primary }]}>Member</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={onEditProfile}>
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.primaryBtnGradient}>
                    <Text style={styles.primaryBtnText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={onManageContacts}>
                  <Text style={styles.secondaryBtnText}>Emergency Contacts</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card: Preferences */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Preferences</Text>

              <View style={styles.prefRow}>
                <View>
                  <Text style={styles.prefTitle}>Push Notifications</Text>
                  <Text style={styles.prefSubtitle}>Safety alerts, route updates</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  thumbColor={notificationsEnabled ? colors.primary : '#ccc'}
                  trackColor={{ true: 'rgba(99,102,241,0.4)', false: 'rgba(0,0,0,0.15)' }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.prefRow}>
                <View>
                  <Text style={styles.prefTitle}>Dark Mode</Text>
                  <Text style={styles.prefSubtitle}>Use dark theme across the app</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  thumbColor={darkMode ? colors.secondary : '#ccc'}
                  trackColor={{ true: 'rgba(139,92,246,0.4)', false: 'rgba(0,0,0,0.15)' }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.prefRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.prefTitle}>Shake to send SOS</Text>
                  <Text style={styles.prefSubtitle}>Shake the phone to trigger an SOS alert</Text>
                </View>
                <Switch
                  value={shakeEnabled}
                  onValueChange={setShakeEnabled}
                  thumbColor={shakeEnabled ? colors.primary : '#ccc'}
                  trackColor={{ true: 'rgba(99,102,241,0.4)', false: 'rgba(0,0,0,0.15)' }}
                />
              </View>
            </View>

            {/* Card: Locations */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Locations</Text>

              <TouchableOpacity style={styles.listRow} onPress={() => navigation.navigate('SavedAddresses')}>
                <Text style={styles.listRowText}>Saved Addresses</Text>
                <Text style={styles.listRowIcon}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Card: Security */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Security</Text>

              <TouchableOpacity style={styles.listRow} onPress={onPrivacy}>
                <Text style={styles.listRowText}>Privacy & Security</Text>
                <Text style={styles.listRowIcon}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.listRow} onPress={onLogout}>
                <Text style={[styles.listRowText, { color: colors.danger }]}>Log out</Text>
                <Text style={[styles.listRowIcon, { color: colors.danger }]}>↪</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <Text style={styles.footerText}>SafeRoute v1.0.0</Text>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary + '40',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  cameraText: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  email: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryBtn: { flex: 1 },
  primaryBtnGradient: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.text,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 12,
    fontSize: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  prefSubtitle: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  listRowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  listRowIcon: {
    color: colors.textSecondary,
    fontSize: 22,
  },
  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 12,
  },
});
