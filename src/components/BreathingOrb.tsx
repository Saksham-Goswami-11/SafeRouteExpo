import React, { useEffect } from 'react';
import { StyleSheet, View, Vibration, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withDelay,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface BreathingOrbProps {
    onSOS: () => void;
}

export const BreathingOrb: React.FC<BreathingOrbProps> = ({ onSOS }) => {
    // Animation Values
    const scale = useSharedValue(1);
    const ripple1Opacity = useSharedValue(0);
    const ripple1Scale = useSharedValue(1);
    const ripple2Opacity = useSharedValue(0);
    const ripple2Scale = useSharedValue(1);
    const isPressed = useSharedValue(0); // 0 or 1

    // Continuous Breathing Animation
    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Ripple 1
        ripple1Opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1000 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            false
        );
        ripple1Scale.value = withRepeat(
            withTiming(2, { duration: 2500, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        // Ripple 2 (Delayed)
        ripple2Opacity.value = withDelay(
            1200,
            withRepeat(
                withSequence(
                    withTiming(0.4, { duration: 1000 }),
                    withTiming(0, { duration: 1500 })
                ),
                -1,
                false
            )
        );
        ripple2Scale.value = withDelay(
            1200,
            withRepeat(
                withTiming(2.2, { duration: 2500, easing: Easing.out(Easing.ease) }),
                -1,
                false
            )
        );
    }, []);

    const animatedOrbStyle = useAnimatedStyle(() => {
        // When pressed, shrink slightly. Otherwise, breathe.
        const currentScale = isPressed.value === 1 ? 0.9 : scale.value;
        return {
            transform: [{ scale: withTiming(currentScale, { duration: 200 }) }],
        };
    });

    const ripple1Style = useAnimatedStyle(() => {
        return {
            opacity: isPressed.value ? 0 : ripple1Opacity.value, // Hide ripples when pressed
            transform: [{ scale: ripple1Scale.value }],
        };
    });

    const ripple2Style = useAnimatedStyle(() => {
        return {
            opacity: isPressed.value ? 0 : ripple2Opacity.value,
            transform: [{ scale: ripple2Scale.value }],
        };
    });

    const handlePressIn = () => {
        isPressed.value = 1;
        Vibration.vibrate(10); // Light haptic
    };

    const handlePressOut = () => {
        isPressed.value = 0;
    };

    const handleLongPress = () => {
        Vibration.vibrate([0, 50, 50, 50]); // Pattern: wait 0, vib 50, sleep 50, vib 50
        onSOS();
    };

    return (
        <View style={styles.container}>
            {/* Ripple Rings */}
            <Animated.View style={[styles.ripple, ripple2Style]} />
            <Animated.View style={[styles.ripple, ripple1Style]} />

            {/* Main Gradient Orb */}
            <Pressable
                onLongPress={handleLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                delayLongPress={800} // .8s hold to activate
                style={styles.touchable}
            >
                <Animated.View style={[styles.orb, animatedOrbStyle]}>
                    <LinearGradient
                        colors={['#00F0FF', '#7F00FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    />
                    <View style={styles.innerGlow} />
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    touchable: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    orb: {
        width: 120,
        height: 120,
        borderRadius: 60,
        shadowColor: '#00F0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    innerGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    ripple: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
    },
});
