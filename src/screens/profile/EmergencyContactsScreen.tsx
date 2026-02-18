import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  ActionSheetIOS,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Trash2 } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeOutUp, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { deleteContact, EmergencyContact, fetchContacts, updateContact, addContact } from '../../services/contactsService';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function EmergencyContactsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Data State
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);

  // Picker State
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<Contacts.Contact[]>([]);
  const [filteredPhoneContacts, setFilteredPhoneContacts] = useState<Contacts.Contact[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await fetchContacts(user.id);
      setContacts(list);
    } catch (error) {
      console.error('Failed to load contacts', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [user?.id])
  );

  const handleCall = (phone: string) => {
    let phoneNumber = phone;
    if (Platform.OS !== 'android') {
      phoneNumber = `telprompt:${phone}`;
    } else {
      phoneNumber = `tel:${phone}`;
    }
    Linking.openURL(phoneNumber).catch(err => Alert.alert("Error", "Could not initiate call"));
  };

  const handleOpenPicker = async () => {
    setPickerLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });

        if (data.length > 0) {
          const validContacts = data
            .filter((c: Contacts.Contact) => c.phoneNumbers && c.phoneNumbers.length > 0)
            .sort((a: Contacts.Contact, b: Contacts.Contact) => (a.name || '').localeCompare(b.name || ''));

          setPhoneContacts(validContacts);
          setFilteredPhoneContacts(validContacts);
          setContactModalVisible(true);
        } else {
          Alert.alert("No Contacts", "No contacts with phone numbers found.");
        }
      } else {
        Alert.alert("Permission Required", "Please grant access to contacts to select one.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to access contacts.");
    } finally {
      setPickerLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      const filtered = phoneContacts.filter(
        c => c.name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPhoneContacts(filtered);
    } else {
      setFilteredPhoneContacts(phoneContacts);
    }
  };

  const onSelectContact = async (contact: Contacts.Contact) => {
    if (!user) return;
    const phoneItem = contact.phoneNumbers?.[0];
    if (!phoneItem) return;

    let phoneNumber = phoneItem.number || '';
    // Normalize: remove generic non-digit characters except '+'
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Attempt to extract First Name for Relation (heuristic)
    // or just use "Friend" as default if relation is unknown
    const firstName = contact.name?.split(' ')[0] || 'Friend';

    try {
      await addContact(user.id, {
        name: contact.name || 'Unknown',
        phone: phoneNumber,
        relation: firstName, // Default relation guess
        is_active_simulated: Math.random() > 0.5 ? 1 : 0, // Random status as before
        // Use local URI if available, might check permissions again but assuming OK
        avatar_uri: contact.image?.uri
      });
      setContactModalVisible(false);
      loadContacts();
    } catch (e) {
      Alert.alert("Error", "Could not add this contact.");
    }
  };

  const handleContactPress = (contact: EmergencyContact) => {
    const options = ['Call', 'Toggle Active Status', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: contact.name,
          message: `Relation: ${contact.relation || 'N/A'}`,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            handleCall(contact.phone);
          } else if (buttonIndex === 1) {
            const newStatus = contact.is_active_simulated ? 0 : 1;
            await updateContact(contact.id, { is_active_simulated: newStatus }, user?.id);
            loadContacts();
          } else if (buttonIndex === 2) {
            Alert.alert(
              "Delete Contact",
              "Are you sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete", style: "destructive", onPress: async () => {
                    await deleteContact(contact.id, user?.id);
                    loadContacts();
                  }
                }
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        contact.name,
        `Choose an action`,
        [
          { text: "Call", onPress: () => handleCall(contact.phone) },
          {
            text: contact.is_active_simulated ? "Set Inactive" : "Set Active",
            onPress: async () => {
              const newStatus = contact.is_active_simulated ? 0 : 1;
              await updateContact(contact.id, { is_active_simulated: newStatus }, user?.id);
              loadContacts();
            }
          },
          {
            text: "Delete", style: 'destructive', onPress: async () => {
              await deleteContact(contact.id, user?.id);
              loadContacts();
            }
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  const handleDeletePress = (contact: EmergencyContact) => {
    Alert.alert(
      "Remove Contact?",
      `Are you sure you want to remove ${contact.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact(contact.id, user?.id);
              loadContacts();
            } catch (e) {
              Alert.alert("Error", "Failed to delete contact.");
            }
          }
        }
      ]
    );
  };

  const ContactCard = ({ item, index }: { item: EmergencyContact, index: number }) => {
    const isActive = item.is_active_simulated === 1;
    // Neon Green for active, Grey for inactive
    const statusColor = isActive ? '#39FF14' : '#64748B';

    // Status Ring Glow Animation
    const glowOpacity = useSharedValue(0.5);

    useEffect(() => {
      if (isActive) {
        glowOpacity.value = withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
      } else {
        glowOpacity.value = 0; // No glow if inactive
      }
    }, [isActive]);

    const glowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
      shadowOpacity: glowOpacity.value,
    }));

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
        exiting={FadeOutUp}
        style={styles.cardContainer}
      >
        <TouchableOpacity onPress={() => handleContactPress(item)} activeOpacity={0.8}>
          <BlurView intensity={15} tint="dark" style={styles.glassCard}>
            <View style={styles.cardContent}>

              {/* Avatar Section */}
              <View style={styles.avatarWrapper}>
                {/* Status Ring */}
                <Animated.View style={[
                  styles.statusRing,
                  { borderColor: statusColor, shadowColor: statusColor },
                  isActive && glowStyle
                ]}>
                  <View style={styles.avatarContainer}>
                    {item.avatar_uri ? (
                      <Image source={{ uri: item.avatar_uri }} style={styles.avatarImage} />
                    ) : (
                      <LinearGradient
                        colors={['#4c669f', '#3b5998', '#192f6a']}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarInitials}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </Animated.View>

                {/* Online/Active Indicator Dot (Optional additional cue) */}
                {isActive && (
                  <View style={[styles.statusDot, { backgroundColor: statusColor, shadowColor: statusColor }]} />
                )}
              </View>

              {/* Info Section */}
              <View style={styles.infoContainer}>
                <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.relationText}>{item.relation || 'Emergency Contact'}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: 'rgba(0, 240, 255, 0.1)', borderColor: 'rgba(0, 240, 255, 0.2)' }]}
                  onPress={() => handleCall(item.phone)}
                >
                  <Ionicons name="call" size={18} color="#00F0FF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', marginLeft: 8 }]}
                  onPress={() => handleDeletePress(item)}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const PickerItem = ({ item }: { item: Contacts.Contact }) => (
    <TouchableOpacity onPress={() => onSelectContact(item)} style={styles.pickerItem}>
      <View style={styles.pickerAvatar}>
        {item.imageAvailable && item.image ? (
          <Image source={{ uri: item.image.uri }} style={styles.pickerImage} />
        ) : (
          <View style={[styles.pickerImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#888' }}>{item.name?.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.pickerInfo}>
        <Text style={styles.pickerName}>{item.name}</Text>
        <Text style={styles.pickerPhone}>{item.phoneNumbers?.[0]?.number}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color="#00F0FF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background: Deep Black to Midnight Blue */}
      <LinearGradient
        colors={['#050505', '#1a0b2e', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Aurora Effect (Subtle top glow) */}
      <LinearGradient
        colors={['rgba(0, 240, 255, 0.05)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 300 }]}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Team</Text>
        <Text style={styles.headerSubtitle}>Trusted contacts for SOS alerts</Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ContactCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts added yet.</Text>
            <Text style={styles.emptySubText}>Add people you trust to keep you safe.</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={handleOpenPicker}
        activeOpacity={0.8}
        disabled={pickerLoading}
      >
        <BlurView intensity={20} tint="light" style={styles.fabBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
            style={styles.fabGradient}
          >
            {pickerLoading ? <ActivityIndicator color="#FFF" /> : <Ionicons name="add" size={32} color="#FFF" />}
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>

      {/* Contact Picker Modal */}
      <Modal
        visible={contactModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>

            <FlatList
              data={filteredPhoneContacts}
              keyExtractor={(item) => (item as any).id || Math.random().toString()}
              renderItem={({ item }) => <PickerItem item={item} />}
              style={styles.modalList}
              initialNumToRender={10}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased to 120 to avoid overlap
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden', // For BlurView
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  statusRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#000', // Matches background to create a 'cutout' effect
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  relationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 110, // Increased to 110px to assume floating above tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabBlur: {
    flex: 1,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    opacity: 0.5
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubText: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 4
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    backgroundColor: '#050505',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
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
  closeText: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  modalList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pickerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
  },
  pickerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerPhone: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});
