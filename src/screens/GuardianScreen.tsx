import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../services/supabaseClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Battery, Zap, Navigation, MapPin, Signal } from 'lucide-react-native';
import { RealtimeChannel } from '@supabase/supabase-js';

const { width, height } = Dimensions.get('window');

// Tactical Silver Map Style
const SILVER_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

const GuardianScreen = () => {
    const [targetUid, setTargetUid] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [childData, setChildData] = useState<any>(null);
    const [myLocation, setMyLocation] = useState<Location.LocationObjectCoords | null>(null);
    const mapRef = useRef<MapView>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // 1. Get Parent Location on Mount
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to track distance.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setMyLocation(location.coords);
        })();

        // Cleanup channel on unmount
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    // 2. Connect & Subscribe to Telemetry via Supabase Realtime
    const handleConnect = async () => {
        if (!targetUid.trim()) {
            Alert.alert("Input Error", "Please enter a valid User ID.");
            return;
        }

        try {
            // First, fetch the current alert data
            const { data: initialData, error: fetchError } = await supabase
                .from('active_alerts')
                .select('*')
                .eq('user_id', targetUid.trim())
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !initialData) {
                Alert.alert("Target Not Found", "No active alert found for this User ID.");
                return;
            }

            // Set initial data
            setChildData({
                ...initialData,
                coordinates: {
                    latitude: initialData.latitude,
                    longitude: initialData.longitude,
                    heading: initialData.heading,
                    speed: initialData.speed,
                },
            });
            setIsConnected(true);

            // Subscribe to realtime updates
            const channel = supabase
                .channel(`guardian-${targetUid.trim()}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'active_alerts',
                        filter: `user_id=eq.${targetUid.trim()}`,
                    },
                    (payload) => {
                        const newData = payload.new as any;
                        setChildData({
                            ...newData,
                            coordinates: {
                                latitude: newData.latitude,
                                longitude: newData.longitude,
                                heading: newData.heading,
                                speed: newData.speed,
                            },
                        });
                    }
                )
                .subscribe();

            channelRef.current = channel;
        } catch (error: any) {
            Alert.alert("Connection Error", error.message);
        }
    };

    // 3. Format Telemetry
    const getBatteryColor = (level: number) => {
        if (level < 0) return '#9ca3af';
        if (level <= 0.2) return '#ef4444';
        return '#22c55e';
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Offline';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 4. Handle External Navigation
    const handleNavigation = () => {
        if (!childData?.coordinates) return;

        const { latitude, longitude } = childData.coordinates;
        const scheme = Platform.select({ ios: 'maps://?daddr=', android: 'google.navigation:q=' });
        const url = `${scheme}${latitude},${longitude}`;

        Linking.openURL(url);
    };

    // --- RENDER: CONNECTION SCREEN ---
    if (!isConnected) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.loginContent}>
                    <View style={styles.iconContainer}>
                        <Signal size={64} color="#ef4444" />
                    </View>

                    <Text style={styles.title}>GUARDIAN<Text style={styles.titleBold}>CENTER</Text></Text>
                    <Text style={styles.subtitle}>Tactical Overwatch System</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Target User ID"
                            placeholderTextColor="#6b7280"
                            value={targetUid}
                            onChangeText={setTargetUid}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                        <Text style={styles.connectButtonText}>ESTABLISH UPLINK</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // --- RENDER: TACTICAL MAP ---
    const childCoords = childData?.coordinates;
    const batteryLevel = childData?.battery ?? -1;
    const speed = childData?.speed ? (childData.speed * 3.6).toFixed(1) : '0.0';

    return (
        <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={SILVER_MAP_STYLE}
                initialRegion={{
                    latitude: childCoords?.latitude || 20.5937,
                    longitude: childCoords?.longitude || 78.9629,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
            >
                {/* Child Marker */}
                {childCoords && (
                    <Marker
                        coordinate={{ latitude: childCoords.latitude, longitude: childCoords.longitude }}
                        title="Target (Child)"
                        description={`Speed: ${speed} km/h`}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[styles.pulseRing, { borderColor: '#ef4444' }]} />
                            <View style={[styles.markerDot, { backgroundColor: '#ef4444' }]} />
                        </View>
                    </Marker>
                )}

                {/* Route Line */}
                {myLocation && childCoords && (
                    <Polyline
                        coordinates={[
                            { latitude: myLocation.latitude, longitude: myLocation.longitude },
                            { latitude: childCoords.latitude, longitude: childCoords.longitude }
                        ]}
                        strokeColor="#3b82f6"
                        strokeWidth={4}
                        lineDashPattern={[10, 5]}
                    />
                )}
            </MapView>

            {/* Floating Tactical HUD */}
            <View style={styles.hudContainer}>
                <View style={styles.hudCard}>
                    {/* Header */}
                    <View style={styles.hudHeader}>
                        <View style={styles.statusBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.statusText}>LIVE TRACKING</Text>
                        </View>
                        <Text style={styles.lastUpdated}>{formatTime(childData?.last_updated)}</Text>
                    </View>

                    {/* Telemetry Grid */}
                    <View style={styles.statsGrid}>
                        {/* Battery */}
                        <View style={styles.statItem}>
                            <View style={styles.statLabelRow}>
                                <Battery size={16} color={getBatteryColor(batteryLevel)} />
                                <Text style={styles.statLabel}>PROXIMITY FUEL</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getBatteryColor(batteryLevel) }]}>
                                {batteryLevel >= 0 ? `${Math.round(batteryLevel * 100)}%` : '--'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Speed */}
                        <View style={styles.statItem}>
                            <View style={styles.statLabelRow}>
                                <Zap size={16} color="#3b82f6" />
                                <Text style={styles.statLabel}>VELOCITY</Text>
                            </View>
                            <Text style={styles.statValue}>
                                {speed} <Text style={styles.unit}>km/h</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.locationRow}>
                        <MapPin size={16} color="#9ca3af" />
                        <Text style={styles.coordText}>
                            {childCoords?.latitude.toFixed(5)}, {childCoords?.longitude.toFixed(5)}
                        </Text>
                    </View>

                    {/* Navigation Button */}
                    <TouchableOpacity style={styles.navButton} onPress={handleNavigation}>
                        <Navigation size={20} color="#fff" fill="#fff" />
                        <Text style={styles.navButtonText}>NAVIGATE TO TARGET</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loginContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    iconContainer: { marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 20, borderRadius: 50 },
    title: { fontSize: 28, color: '#fff', fontWeight: '300', letterSpacing: 2 },
    titleBold: { fontWeight: '900', color: '#ef4444' },
    subtitle: { color: '#9ca3af', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },

    inputContainer: { width: '100%', marginTop: 40 },
    input: {
        backgroundColor: '#1f2937',
        color: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
        textAlign: 'center',
        fontSize: 18,
        letterSpacing: 1
    },

    connectButton: {
        marginTop: 20,
        backgroundColor: '#ef4444',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    connectButtonText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    mapContainer: { flex: 1 },
    map: { width: '100%', height: '100%' },

    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
    pulseRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        opacity: 0.5,
    },

    hudContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    hudCard: {
        width: '100%',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    hudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    statusText: { color: '#22c55e', fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },
    lastUpdated: { color: '#6b7280', fontSize: 12 },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    statItem: { alignItems: 'center' },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
    statLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
    unit: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
    divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },

    locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
    coordText: { color: '#9ca3af', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    navButton: {
        marginTop: 20,
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});

export default GuardianScreen;
