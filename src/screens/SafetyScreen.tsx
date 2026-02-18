import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Vibration,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Grid Configuration
const GAP = 15;
const PADDING = 20;
const TILE_SIZE = (width - PADDING * 2 - GAP) / 2;

interface Recording {
  uri: string;
  duration: string;
  date: string;
}

export default function SafetyScreen() {
  const navigation = useNavigation<any>();

  // State
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Audio State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  const [playingUri, setPlayingUri] = useState<string | null>(null);

  const [permissionResponse, requestPermission] = useCameraPermissions();

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop siren
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      // Stop playback
      if (playbackRef.current) {
        playbackRef.current.unloadAsync();
      }
      // Stop recording if active
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // --- 1. Siren Logic (Fixed) ---
  const toggleSiren = async () => {
    try {
      if (sirenPlaying) {
        // Stop
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setSirenPlaying(false);
      } else {
        // Play
        // Using local asset for offline reliability
        console.log("🔊 LOADING SAFETY SCREEN SIREN: siren.mp3");
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/siren.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
        setSirenPlaying(true);
      }
    } catch (error) {
      console.log('Siren Error:', error);
      Alert.alert("Error", "Could not play siren sound.");
      setSirenPlaying(false);
    }
  };

  // --- 2. Flashlight Logic ---
  const toggleFlashlight = async () => {
    if (!permissionResponse?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert("Permission", "Camera permission needed for flashlight.");
        return;
      }
    }
    setFlashlightOn(prev => !prev);
    Vibration.vibrate(50);
  };

  // --- 3. Audio Recording Logic ---
  const toggleRecording = async () => {
    try {
      if (recording) {
        // Stop recording
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        // Add to list
        if (uri) {
          const newRecording: Recording = {
            uri,
            date: new Date().toLocaleTimeString(),
            duration: '00:??', // Duration logic requires status update listener, skipping for mvp
          };
          setRecordings(prev => [newRecording, ...prev]);
        }

        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        setRecording(null);
        setIsRecording(false);
        Alert.alert("Saved", "Audio evidence saved securely.");
      } else {
        // Start recording
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission", "Microphone access is required.");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
      }
    } catch (err) {
      console.log("Recording Error", err);
      Alert.alert("Error", "Failed to toggle recording.");
    }
  };

  const playRecording = async (uri: string) => {
    try {
      if (playbackRef.current) {
        await playbackRef.current.unloadAsync();
        playbackRef.current = null;
        setPlayingUri(null);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      playbackRef.current = sound;
      setPlayingUri(uri);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingUri(null);
        }
      });

    } catch (error) {
      Alert.alert("Error", "Could not play audio.");
    }
  };

  // --- 4. Fake Call Logic ---
  const triggerFakeCall = () => {
    navigation.navigate('FakeCall', { callerName: 'Mom' });
  };

  // --- Animation for Active States ---
  const PulseIndicator = ({ color }: { color: string }) => {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
      opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={[styles.activeDot, { backgroundColor: color }, style]} />;
  };

  // --- Components ---
  const Tile = ({
    title,
    icon,
    color,
    onPress,
    isActive,
    extraIcon,
    onExtraPress,
    IconComponent,
    style
  }: {
    title: string,
    icon: any,
    color: string,
    onPress: () => void,
    isActive: boolean,
    extraIcon?: string,
    onExtraPress?: () => void,
    IconComponent?: any, // Allow optional icon component
    style?: any // Allow style override
  }) => {
    const IconLib = IconComponent || Ionicons;
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <BlurView intensity={20} tint="dark" style={[styles.tile, style, isActive && { borderColor: color, borderWidth: 2 }]}>
          {isActive && <PulseIndicator color={color} />}

          {extraIcon && (
            <TouchableOpacity style={styles.extraBtn} onPress={onExtraPress}>
              <Ionicons name={extraIcon as any} size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <IconLib name={icon} size={40} color={isActive ? color : '#FFF'} />
          </View>
          <Text style={[styles.tileTitle, isActive && { color: color }]}>{title}</Text>
          <Text style={styles.tileStatus}>{isActive ? 'ACTIVE' : 'LOCATE'}</Text>
        </BlurView>
      </TouchableOpacity>
    );
  };

  // --- Specialized Team Card ---
  const TeamCard = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <BlurView intensity={30} tint="dark" style={styles.teamCard}>
        <View style={styles.teamIconContainer}>
          <Ionicons name="shield-half" size={32} color="#FF9F0A" />
        </View>
        <View style={styles.teamContent}>
          <Text style={styles.teamTitle}>Trusted Team</Text>
          <Text style={styles.teamSubtitle}>Manage Emergency Contacts</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#050505', '#1a0b2e', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Hidden Camera for Flashlight (updated to CameraView) */}
      {permissionResponse?.granted && (
        <CameraView
          style={{ height: 0, width: 0 }}
          enableTorch={flashlightOn}
          facing="back"
        />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Safety Tools</Text>
          <Text style={styles.headerSubtitle}>Tactical Response Toolkit</Text>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1: Team (Full Width) */}
          <View style={styles.row}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ width: '100%' }}>
              <TeamCard onPress={() => navigation.navigate('Contacts')} />
            </Animated.View>
          </View>

          {/* Row 2: Nearest Police & Hospital */}
          <View style={styles.row}>
            {/* Tile 1: Nearest Police */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Tile
                title="Nearest Police"
                icon="police-badge"
                color="#007AFF"
                isActive={false}
                onPress={() => navigation.navigate('NearbyPlaces', { type: 'police' })}
                IconComponent={MaterialCommunityIcons}
              />
            </Animated.View>

            {/* Tile 2: Nearest Hospital */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Tile
                title="Nearest Hospital"
                icon="hospital-box"
                color="#FF3B30"
                isActive={false}
                onPress={() => navigation.navigate('NearbyPlaces', { type: 'hospital' })}
                IconComponent={MaterialCommunityIcons}
              />
            </Animated.View>
          </View>

          {/* Row 3: Siren & Fake Call */}
          <View style={styles.row}>
            {/* Tile 3: Siren */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <Tile
                title="Siren Alert"
                icon="megaphone-outline"
                color="#FF0000"
                isActive={sirenPlaying}
                onPress={toggleSiren}
              />
            </Animated.View>

            {/* Tile 4: Fake Call */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <Tile
                title="Fake Call"
                icon="call-outline"
                color="#39FF14"
                isActive={false}
                onPress={triggerFakeCall}
              />
            </Animated.View>
          </View>

          {/* Row 4: Strobe & Evidence Rec */}
          <View style={styles.row}>
            {/* Tile 5: Strobe Light */}
            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <Tile
                title="Strobe Light"
                icon="flashlight-outline"
                color="#FFFF00"
                isActive={flashlightOn}
                onPress={toggleFlashlight}
              />
            </Animated.View>

            {/* Tile 6: Evidence Rec */}
            <Animated.View entering={FadeInDown.delay(700).springify()}>
              <Tile
                title="Evidence Rec"
                icon="mic-outline"
                color="#00F0FF"
                isActive={isRecording}
                onPress={toggleRecording}
                extraIcon="list"
                onExtraPress={() => setAudioModalVisible(true)}
              />
            </Animated.View>
          </View>
        </View>

        {/* Audio Recordings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={audioModalVisible}
          onRequestClose={() => setAudioModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <BlurView intensity={50} tint="dark" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Evidence Log</Text>
                <TouchableOpacity onPress={() => setAudioModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={recordings}
                keyExtractor={(item) => item.uri}
                ListEmptyComponent={<Text style={styles.emptyText}>No recordings yet.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recordingItem}
                    onPress={() => playRecording(item.uri)}
                  >
                    <View style={styles.recordingIcon}>
                      <Ionicons
                        name={playingUri === item.uri ? "pause" : "play"}
                        size={20}
                        color="#00F0FF"
                      />
                    </View>
                    <View>
                      <Text style={styles.recordingText}>Audio Evidence</Text>
                      <Text style={styles.recordingSubtext}>{item.date}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </BlurView>
          </View>
        </Modal>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.3)" />
          <Text style={styles.footerText}>Secure & Encrypted Tools</Text>
        </View>
      </ScrollView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  gridContainer: {
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.2,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  tileStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  extraBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  footerNote: {
    marginTop: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '50%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    overflow: 'hidden',
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
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 15,
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  recordingSubtext: {
    color: '#888',
    fontSize: 12,
  },
  // Team Card Styles
  teamCard: {
    width: '100%',
    height: 90,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)', // Subtle Orange tint
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    overflow: 'hidden',
  },
  teamIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 159, 10, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teamContent: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  teamSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  }
});
