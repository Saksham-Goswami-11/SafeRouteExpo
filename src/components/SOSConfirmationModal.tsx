import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width * 0.8;
const SLIDER_THRESHOLD = SLIDER_WIDTH * 0.7;

interface SOSConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SOSConfirmationModal({
  visible,
  onConfirm,
  onCancel,
}: SOSConfirmationModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCountdown(10);
      slideAnim.setValue(0);
      Vibration.vibrate([500, 500, 500]); // Vibrate to alert user

      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < SLIDER_WIDTH - 50) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SLIDER_THRESHOLD) {
          onCancel();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.danger, colors.accent]}
          style={styles.gradient}
        >
          <Text style={styles.title}>EMERGENCY SOS</Text>
          <Text style={styles.subtitle}>
            Sending your location to emergency contacts in...
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{countdown}</Text>
          </View>

          <Text style={styles.cancelInstruction}>
            Slide to cancel
          </Text>

          <View style={styles.sliderContainer}>
            <Animated.View
              style={[styles.sliderHandle, { transform: [{ translateX: slideAnim }] }]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.sliderIcon}>››</Text>
            </Animated.View>
            <Text style={styles.sliderText}>CANCEL</Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.9)',
    },
    gradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 2,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: 40,
    },
    timerContainer: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 5,
      borderColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    timerText: {
      fontSize: 72,
      fontWeight: 'bold',
      color: colors.text,
    },
    cancelInstruction: {
      fontSize: 18,
      color: colors.text,
      opacity: 0.9,
      marginBottom: 20,
    },
    sliderContainer: {
      width: SLIDER_WIDTH,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingLeft: 5,
    },
    sliderHandle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sliderIcon: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.danger,
    },
    sliderText: {
      position: 'absolute',
      alignSelf: 'center',
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
      opacity: 0.5,
      letterSpacing: 2,
    },
  });