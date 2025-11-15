import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { addSavedAddress, deleteSavedAddress, fetchSavedAddresses, SavedAddress, updateSavedAddress } from '../../services/addressService';
import * as Location from 'expo-location';

export default function SavedAddressesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const load = async () => {
    if (!user) return;
    const data = await fetchSavedAddresses(user.id);
    setItems(data);
  };

  useEffect(() => { load(); }, [user?.id]);

  const onAdd = async () => {
    try {
      if (!user) return Alert.alert('Login required', 'Please log in to manage addresses');
      if (!label || !addressText || !lat || !lng) return Alert.alert('Missing fields', 'Please fill all fields');
      await addSavedAddress(user.id, { label, address_text: addressText, latitude: parseFloat(lat), longitude: parseFloat(lng) });
      setLabel(''); setAddressText(''); setLat(''); setLng('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add');
    }
  };

  const onDelete = async (id: string) => {
    await deleteSavedAddress(id, user?.id);
    await load();
  };

  const handleGetCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to get your current address.');
        setIsFetchingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setLat(latitude.toString());
      setLng(longitude.toString());
      
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        Alert.alert('Error', 'Google Maps API key is not configured.');
        setIsFetchingLocation(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAddressText(data.results[0].formatted_address);
        } else {
          setAddressText('Address not found');
        }
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        setAddressText('Address not found');
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert('Error', 'Could not fetch your current location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Saved Addresses</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Add new</Text>
          <TextInput style={styles.input} placeholder="Label (e.g., Home)" placeholderTextColor={colors.textMuted} value={label} onChangeText={setLabel} />
          
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.currentLocationBtn} disabled={isFetchingLocation}>
            {isFetchingLocation ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Use Current Location</Text>
            )}
          </TouchableOpacity>

          <TextInput style={styles.input} placeholder="Address text" placeholderTextColor={colors.textMuted} value={addressText} onChangeText={setAddressText} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Latitude" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={lat} onChangeText={setLat} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Longitude" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={lng} onChangeText={setLng} />
          </View>
          <TouchableOpacity onPress={onAdd}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.addBtn}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>Add Address</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={{ flex: 1 }}>
                {editId === item.id ? (
                  <>
                    <Text style={[styles.itemAddress, { marginBottom: 6 }]}>Rename label</Text>
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholder="New label"
                      placeholderTextColor={colors.textMuted}
                      value={editLabel}
                      onChangeText={setEditLabel}
                    />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={async () => {
                          if (!editLabel.trim()) return Alert.alert('Missing', 'Label cannot be empty');
                          await updateSavedAddress(item.id, { label: editLabel.trim() }, user?.id);
                          setEditId(null);
                          setEditLabel('');
                          await load();
                        }}
                        style={{ flex: 1 }}
                      >
                        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.smallBtn}>
                          <Text style={{ color: colors.text, fontWeight: '800', textAlign: 'center' }}>Save</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setEditId(null); setEditLabel(''); }}
                        style={{ flex: 1 }}
                      >
                        <View style={[styles.smallBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }] }>
                          <Text style={{ color: colors.textSecondary, fontWeight: '800', textAlign: 'center' }}>Cancel</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemAddress}>{item.address_text}</Text>
                    <Text style={styles.itemCoords}>{item.latitude}, {item.longitude}</Text>
                  </>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {editId === item.id ? null : (
                  <TouchableOpacity onPress={() => { setEditId(item.id); setEditLabel(item.label); }}>
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>Rename</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(item.id)}>
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16, color: colors.text },
  card: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 14, backgroundColor: colors.backgroundCard, borderColor: 'rgba(255,255,255,0.08)' },
  label: { marginBottom: 8, color: colors.textSecondary },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, marginBottom: 10, backgroundColor: colors.background, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' },
  addBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  currentLocationBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: 10 },
  smallBtn: { height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listItem: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, backgroundColor: colors.backgroundCard, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' },
  itemLabel: { color: colors.text, fontWeight: '800', marginBottom: 2 },
  itemAddress: { color: colors.textSecondary, marginBottom: 2 },
  itemCoords: { color: colors.textMuted, fontSize: 12 },
});
