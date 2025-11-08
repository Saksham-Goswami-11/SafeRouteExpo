import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

export type LoginScreenNavProp = StackNavigationProp<ProfileStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: LoginScreenNavProp }) {
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      // Navigation is now handled by the AuthContext's onAuthStateChanged listener.
      // No need to navigate manually here.
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      // AuthContext's listener will handle navigation upon successful
      // Google sign-in.
    } catch (e: any) {
      setError(e.message || 'Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    // Placeholder for Facebook login
    await loginWithFacebook();
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Log in to your account</Text>

        <View style={styles.form}>
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
                <Text style={[styles.submitText, { color: colors.text }]}>Log in</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or log in with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialLoginContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              {/* In a real app, you'd use an actual icon image */}
              <Text style={styles.socialIcon}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
              {/* In a real app, you'd use an actual icon image */}
              <Text style={styles.socialIcon}>f</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.replace('Signup')} style={styles.switchAuth}>
            <Text style={{ color: colors.textSecondary }}>Don't have an account? <Text style={{ color: colors.primary }}>Sign up</Text></Text>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: 10,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialIcon: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
});
