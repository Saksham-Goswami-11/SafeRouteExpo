import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

export type SignupScreenNavProp = StackNavigationProp<ProfileStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: { navigation: SignupScreenNavProp }) {
  const { signup } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await signup(email.trim(), password, fullName.trim());
      navigation.replace('ProfileHome');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign up to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Full Name"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <TouchableOpacity onPress={onSubmit} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.submitBtn}>
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.submitText, { color: colors.text }]}>Sign up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.switchAuth}>
            <Text style={{ color: colors.textSecondary }}>Already have an account? <Text style={{ color: colors.primary }}>Log in</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  form: {},
  input: { height: 52, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, marginBottom: 12 },
  submitBtn: { height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '800' },
  error: { marginTop: 6 },
  switchAuth: { alignItems: 'center', marginTop: 14 },
});
