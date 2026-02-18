import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getProfile, upsertProfile } from '../../services/profileService';

export default function EditProfileScreen({ navigation }: any) {
  const { user, profile, updateProfile } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState(profile?.full_name || '');

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile?.full_name]);

  const onSave = async () => {
    try {
      await updateProfile({ full_name: fullName });
      Alert.alert('Saved', 'Profile updated successfully');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save');
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
          placeholder="Full Name"
          placeholderTextColor={colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />

        <TouchableOpacity onPress={onSave}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.saveBtn}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  input: { height: 52, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, marginBottom: 16 },
  saveBtn: { height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
