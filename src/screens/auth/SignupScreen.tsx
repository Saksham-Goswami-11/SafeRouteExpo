import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

export type SignupScreenNavProp = StackNavigationProp<ProfileStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: { navigation: SignupScreenNavProp }) {
  const { signup, loginWithGoogle, loginWithFacebook } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      if (!fullName.trim()) return setError('Please enter your full name.');
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
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#050505', '#1a0b2e', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Aurora */}
      <LinearGradient
        colors={['rgba(0, 240, 255, 0.1)', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: -200, transform: [{ rotate: '20deg' }] }]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Amba to seek safety & stealth.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

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
              <LinearGradient colors={['#00F0FF', '#0090FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={[styles.submitText, { color: '#000' }]}>SIGN UP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.switchText}>Already have an account? <Text style={styles.linkText}>Log In</Text></Text>
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
    shadowColor: '#00F0FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 10,
  },
  submitText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  error: { color: '#FF2D55', marginBottom: 15, textAlign: 'center' },

  footer: { alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  linkText: { color: '#7F00FF', fontWeight: 'bold' },
});
