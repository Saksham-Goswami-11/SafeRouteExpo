import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { addContact, deleteContact, EmergencyContact, fetchContacts, updateContact } from '../../services/contactsService';

export default function EmergencyContactsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const load = async () => {
    if (!user) return;
    const list = await fetchContacts(user.id);
    setContacts(list);
  };

  useEffect(() => { load(); }, [user?.id]);

  const onAdd = async () => {
    try {
      if (!user) return;
      if (!name || !phone) return Alert.alert('Missing', 'Name and phone are required');
      await addContact(user.id, { name, phone, relation });
      setName(''); setPhone(''); setRelation('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add contact');
    }
  };

  const onDelete = async (id: string) => {
    await deleteContact(id, user?.id);
    await load();
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Contacts</Text>

        <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: 'rgba(255,255,255,0.08)' }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Add new</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Phone"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Relation (optional)"
            placeholderTextColor={colors.textMuted}
            value={relation}
            onChangeText={setRelation}
          />
          <TouchableOpacity onPress={onAdd}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.addBtn}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>Add Contact</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.backgroundCard, borderColor: 'rgba(255,255,255,0.08)' }] }>
              <View>
                <Text style={[styles.contactName, { color: colors.text }]}>{item.name} {item.relation ? `• ${item.relation}` : ''}</Text>
                <Text style={{ color: colors.textSecondary }}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => onDelete(item.id)}>
                <Text style={{ color: colors.danger, fontWeight: '800' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 14 },
  label: { marginBottom: 8 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, marginBottom: 10 },
  addBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listItem: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactName: { fontSize: 16, fontWeight: '800' },
});