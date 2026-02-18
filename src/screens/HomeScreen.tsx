import React, { useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    Linking,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useSOS } from '../context/SOSContext';
import { BreathingOrb } from '../components/BreathingOrb';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { colors } = useTheme(); // We can use this for safe/danger colors if needed
    const navigation = useNavigation<any>();
    const { startSOSConfirmation } = useSOS();

    // -- LOGIC PRESERVED --
    const handleSOS = () => {
        startSOSConfirmation();
    };

    const shareLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;
            const message = `Hi! I'm sharing my live location: https://maps.google.com/?q=${latitude},${longitude}`;
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not share location.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background: Deep Black to Midnight Blue */}
            <LinearGradient
                colors={['#050505', '#1A0033']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Aurora Effect (Subtle) */}
            <LinearGradient
                colors={['rgba(127, 0, 255, 0.15)', 'transparent']}
                style={[StyleSheet.absoluteFill, { height: '60%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View entering={FadeIn.duration(800)} style={styles.headerWrapper}>
                    <BlurView intensity={20} tint="dark" style={styles.glassHeader}>
                        <View>
                            <Text style={styles.brandTitle}>Amba</Text>
                            <Text style={styles.brandSubtitle}>Your Guardian</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Text style={styles.bellIcon}>🔔</Text>
                            <View style={styles.notifBadge} />
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>

                {/* Main Action: Breathing Orb */}
                <Animated.View entering={FadeIn.delay(200).duration(1000)} style={styles.orbContainer}>
                    <BreathingOrb onSOS={handleSOS} />

                    {/* Status Pill */}
                    <View style={styles.statusPill}>
                        <BlurView intensity={10} tint="light" style={styles.pillBlur}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>HOLD TO ALERT</Text>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Functionality Grid */}
                <Animated.View entering={SlideInDown.delay(400).springify()} style={styles.gridContainer}>

                    {/* Track Me */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.tileWrapper}
                        onPress={() => navigation.navigate('Navigate')}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.glassTile}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 240, 255, 0.1)' }]}>
                                <Text style={styles.tileIcon}>🗺️</Text>
                            </View>
                            <Text style={styles.tileLabel}>Track Me</Text>
                        </BlurView>
                    </TouchableOpacity>

                    {/* Safe Route */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.tileWrapper}
                        onPress={() => navigation.navigate('Safety')}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.glassTile}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(127, 0, 255, 0.1)' }]}>
                                <Text style={styles.tileIcon}>🛡️</Text>
                            </View>
                            <Text style={styles.tileLabel}>Safe Route</Text>
                        </BlurView>
                    </TouchableOpacity>

                    {/* Share Location */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.tileWrapper}
                        onPress={shareLocation}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.glassTile}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(50, 255, 100, 0.1)' }]}>
                                <Text style={styles.tileIcon}>📍</Text>
                            </View>
                            <Text style={styles.tileLabel}>Share Loc</Text>
                        </BlurView>
                    </TouchableOpacity>

                </Animated.View>

                {/* Safety Score Widget */}
                <Animated.View entering={SlideInDown.delay(600).springify()} style={styles.widgetWrapper}>
                    <BlurView intensity={15} tint="dark" style={styles.scoreWidget}>
                        <View style={styles.widgetRow}>
                            <View>
                                <Text style={styles.widgetLabel}>CURRENT SAFETY</Text>
                                <Text style={styles.widgetSub}>Connaught Place, New Delhi</Text>
                            </View>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreVal}>85</Text>
                            </View>
                        </View>
                        <View style={styles.zoneIndicator}>
                            <View style={[styles.zoneDot, { backgroundColor: '#4ADE80' }]} />
                            <Text style={styles.zoneText}>SAFE ZONE</Text>
                        </View>
                    </BlurView>
                </Animated.View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 120,
        flexGrow: 1,
    },
    headerWrapper: {
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    glassHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    bellIcon: {
        fontSize: 18,
    },
    notifBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF2D55',
        borderWidth: 1,
        borderColor: '#000',
    },

    // Orb Area
    orbContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 50,
        height: 280,
    },
    statusPill: {
        position: 'absolute',
        bottom: 0,
        borderRadius: 20,
        overflow: 'hidden',
    },
    pillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF2D55',
        marginRight: 8,
        shadowColor: '#FF2D55',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
    statusText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 30,
        gap: 12,
    },
    tileWrapper: {
        flex: 1,
        height: 110,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    glassTile: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    tileIcon: {
        fontSize: 20,
    },
    tileLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },

    // Widget
    widgetWrapper: {
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    scoreWidget: {
        padding: 20,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    widgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    widgetLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    widgetSub: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '500',
    },
    scoreCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    scoreVal: {
        color: '#4ADE80',
        fontSize: 20,
        fontWeight: '800',
    },
    zoneIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    zoneDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    zoneText: {
        color: '#4ADE80',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default HomeScreen;
