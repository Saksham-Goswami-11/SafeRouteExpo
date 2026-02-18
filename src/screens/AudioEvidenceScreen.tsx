import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as sqlite from '../services/sqlite';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Define the shape of our audio log
interface AudioLog {
    id: string;
    uri: string;
    timestamp: number;
    duration: string;
}

export default function AudioEvidenceScreen() {
    const navigation = useNavigation();
    const [logs, setLogs] = useState<AudioLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        loadLogs();

        // Cleanup sound on unmount
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await sqlite.getAudioLogs();
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audio logs:", error);
            Alert.alert("Error", "Could not load evidence logs.");
        } finally {
            setLoading(false);
        }
    };

    const handlePlayStop = async (item: AudioLog) => {
        try {
            // 1. If this file is already playing, stop it.
            if (playingId === item.id) {
                await stopAudio();
                return;
            }

            // 2. If another file is playing, stop it first.
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setPlayingId(null);
            }

            // 3. Play the new file
            console.log("▶️ Loading sound:", item.uri);
            const { sound } = await Audio.Sound.createAsync(
                { uri: item.uri },
                { shouldPlay: true }
            );

            soundRef.current = sound;
            setPlayingId(item.id);

            // 4. Handle playback finish
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                    soundRef.current = null;
                }
            });

        } catch (error) {
            console.error("Playback Error:", error);
            Alert.alert("Playback Failed", "Could not play this audio file.");
            setPlayingId(null);
        }
    };

    const stopAudio = async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setPlayingId(null);
    };

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderItem = ({ item, index }: { item: AudioLog, index: number }) => {
        const isPlaying = playingId === item.id;

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <BlurView intensity={20} tint="dark" style={styles.card}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.statusDot, { backgroundColor: isPlaying ? '#00FF00' : '#FF2D55' }]} />
                        <Ionicons name="mic-outline" size={24} color={isPlaying ? '#00FF00' : '#FFF'} />
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.dateText}>{formatTimestamp(item.timestamp)}</Text>
                        <Text style={styles.durationText}>Duration: {item.duration}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.playButton, isPlaying && styles.playingButton]}
                        onPress={() => handlePlayStop(item)}
                    >
                        <Ionicons
                            name={isPlaying ? "stop" : "play"}
                            size={20}
                            color={isPlaying ? "#000" : "#FFF"}
                        />
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a0b2e']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔒 Evidence Vault</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={styles.subtitle}>
                Secure storage of emergency audio recordings.
            </Text>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#7F00FF" />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    style={{ flex: 1 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.emptyText}>No recordings found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    infoContainer: {
        flex: 1,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    durationText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    playingButton: {
        backgroundColor: '#00F0FF',
        borderColor: '#00F0FF',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        opacity: 0.5,
    },
    emptyText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
    },
});
