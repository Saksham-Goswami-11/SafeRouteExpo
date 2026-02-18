import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width - 40; // 20px padding on each side

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
                {/* Optional: Aurora Gradient behind the blur for extra pop */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'rgba(20,0,40,0.5)']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.tabsRow}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        return (
                            <TabIcon
                                key={route.key}
                                isFocused={isFocused}
                                options={options}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                routeName={route.name}
                            />
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

// Sub-component for individual tab icon with animations
function TabIcon({ isFocused, options, onPress, onLongPress, routeName }: any) {
    const scale = useSharedValue(isFocused ? 1.1 : 1);
    // 0 = unfocused, 1 = focused
    const focusVal = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1.2 : 1, { damping: 10 });
        focusVal.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: withTiming(isFocused ? 1 : 0.6)
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: focusVal.value,
            shadowOpacity: focusVal.value
        };
    });

    // Icons map based on route name (generic fallback if not provided in options)
    let iconLabel = "❓";
    if (routeName === "Home") iconLabel = "🏠";
    if (routeName === "Navigate") iconLabel = "🗺️";
    if (routeName === "Safety") iconLabel = "🛡️";
    if (routeName === "Profile") iconLabel = "👤";

    // Custom coloring for "Nano Banana Pro"
    // Deep Violet for Safety, Cyan for Map, White for Home/Profile
    const activeColor = routeName === 'Safety' ? '#FF2D55' : routeName === 'Navigate' ? '#00F0FF' : '#FFFFFF';

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
        >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>

                {/* Visual Glow Background (Only visible when selected) */}
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    styles.glowInfo,
                    glowStyle,
                    { backgroundColor: activeColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : activeColor + '40' } // 40 = 25% opacity
                ]}
                />

                <Text style={{ fontSize: 24, textShadowColor: isFocused ? activeColor : 'transparent', textShadowRadius: 10 }}>
                    {iconLabel}
                </Text>

            </Animated.View>

            {/* Optional Label (Hidden for cleaner look or shown small) */}
            {/* <Text style={{fontSize: 10, color: '#FFF'}}>
                {options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : routeName}
            </Text> */}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // Ensure it sits above everything
        zIndex: 9999,
        elevation: 20,
    },
    blurContainer: {
        width: '100%',
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.4)', // Base dark tint
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        // overflow: 'hidden', // Don't clip shadows
    },
    glowInfo: {
        borderRadius: 25,
        // Add blurred glow box shadow
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 15,
    }
});
