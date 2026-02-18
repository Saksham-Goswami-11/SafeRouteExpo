import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import * as sqlite from '../services/sqlite';

// Color Palette (matching Amba theme)
const COLORS = {
    background: '#050505',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    accent: '#00F0FF', // Cyan
    success: '#00FF9D',
    danger: '#FF2D55',
    border: 'rgba(255, 255, 255, 0.1)',
};

interface ContactItem {
    id: string;
    name: string;
    phone: string;
}

export default function ContactsScreen() {
    const navigation = useNavigation();
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();

            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                    sort: Contacts.SortTypes.FirstName,
                });

                if (data.length > 0) {
                    // Filter valid contacts with phone numbers
                    const validContacts = data
                        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
                        .map(c => ({
                            id: c.id!,
                            name: c.name || 'Unknown',
                            phone: c.phoneNumbers![0].number || '',

                        }));

                    setContacts(validContacts);
                    setFilteredContacts(validContacts);
                }
            } else {
                Alert.alert('Permission Denied', 'Permission to access contacts was denied.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load contacts.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text) {
            const newData = contacts.filter((item) => {
                const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1;
            });
            setFilteredContacts(newData);
        } else {
            setFilteredContacts(contacts);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedContacts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                if (newSet.size >= 5) {
                    Alert.alert('Limit Reached', 'You can only select up to 5 emergency contacts.');
                    return prev;
                }
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        const selectedList = contacts.filter(c => selectedContacts.has(c.id));

        // 1. Check Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const uid = authUser?.id;
        if (!uid) {
            Alert.alert("Login Required", "You must be logged in to save emergency contacts.");
            return;
        }

        setSaving(true);

        try {
            // 2. Loop & Save (Parallel promises for speed)
            const savePromises = selectedList.map(async (item) => {
                // Clean phone number (remove spaces, dashes, etc if needed - basic strip)
                const cleanPhone = item.phone.replace(/[\s-]/g, '');

                const contactData = {
                    id: item.id,
                    name: item.name,
                    phone: cleanPhone,
                    userId: uid
                };

                // Local SQLite
                await sqlite.addEmergencyContact(contactData);

                // Cloud Supabase
                await supabase
                    .from('emergency_contacts')
                    .upsert({
                        id: item.id,
                        user_id: uid,
                        name: item.name,
                        phone: cleanPhone,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });
            });

            await Promise.all(savePromises);

            Alert.alert("Success", "Emergency contacts saved locally and to the cloud!");
            navigation.goBack();

        } catch (error) {
            console.error("Save Error:", error);
            Alert.alert("Error", "Failed to save contacts. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: { item: ContactItem }) => {
        const isSelected = selectedContacts.has(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSelection(item.id)}
                style={[
                    styles.contactCard,
                    isSelected && styles.contactCardSelected
                ]}
            >
                <View style={styles.avatarContainer}>
                    {/* Initials Avatar */}
                    <LinearGradient
                        colors={isSelected ? [COLORS.success, '#00C9FF'] : ['#333', '#444']}
                        style={styles.avatar}
                    >
                        <Text style={[styles.avatarText, isSelected && { color: '#000', fontWeight: 'bold' }]}>
                            {item.name.charAt(0)}
                        </Text>
                    </LinearGradient>
                </View>

                <View style={styles.contactInfo}>
                    <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                </View>

                <View style={styles.checkboxContainer}>
                    {isSelected ? (
                        <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                    ) : (
                        <Ionicons name="ellipse-outline" size={28} color={COLORS.border} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background Gradient */}
            <LinearGradient
                colors={[COLORS.background, '#1a0b2e']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Emergency Contacts</Text>
                    <Text style={styles.subtitle}>Select trusted contacts (Max 5)</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <BlurView intensity={20} tint="dark" style={styles.searchBarBlur}>
                        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search contacts..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </BlurView>
                </View>

                {/* Contacts List */}
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={15}
                        maxToRenderPerBatch={20}
                    />
                )}

                {/* Floating Save Button */}
                {selectedContacts.size > 0 && (
                    <View style={styles.footerContainer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <LinearGradient
                                colors={[COLORS.accent, '#0061FF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.saveGradient}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.saveText}>Save {selectedContacts.size} Contacts</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBarBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for footer
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    contactCardSelected: {
        backgroundColor: 'rgba(0, 255, 157, 0.05)',
        borderColor: 'rgba(0, 255, 157, 0.3)',
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    checkboxContainer: {
        marginLeft: 10,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    saveButton: {
        borderRadius: 20,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 20,
        gap: 10,
    },
    saveText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
