import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

export type LoginScreenNavProp = StackNavigationProp<ProfileStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

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
      navigation.replace('ProfileHome');
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
    } catch (e: any) {
      setError(e.message || 'Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    await loginWithFacebook();
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#050505', '#1a0b2e', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Aurora */}
      <LinearGradient
        colors={['rgba(127, 0, 255, 0.1)', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: -200, transform: [{ rotate: '-20deg' }] }]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to access your safe routes.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity onPress={onSubmit} disabled={loading}>
              <LinearGradient colors={['#7F00FF', '#E100FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>LOG IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
              <Text style={styles.socialIcon}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookLogin}>
              <Text style={styles.socialIcon}>f</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Text style={styles.switchText}>Don't have an account? <Text style={styles.linkText}>Sign Up</Text></Text>
          </TouchableOpacity>
        </Animated.View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  inner: { flex: 1, justifyContent: 'center', padding: 25 },

  title: { fontSize: 36, fontWeight: '900', color: '#FFF', marginBottom: 10, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },

  form: { marginBottom: 30 },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  inputContainer: { marginBottom: 20 },
  inputLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  submitBtn: {
    height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 10,
    shadowColor: '#7F00FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 10,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  error: { color: '#FF2D55', marginBottom: 15, textAlign: 'center' },

  footer: { alignItems: 'center' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold', marginBottom: 20 },

  socialRow: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  socialBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  socialIcon: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },

  switchText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  linkText: { color: '#00F0FF', fontWeight: 'bold' },
});
