import React, { useRef, useEffect } from 'react';
import { Pressable, ViewStyle, StyleProp, Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function AnimatedButton({ onPress, style, children, disabled }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 4,
      tension: 110,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 110,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, { width: Array.isArray(style) || typeof style === 'object' ? (style as any)?.width || undefined : undefined }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          style, 
          { 
            opacity: disabled ? 0.6 : 1,
            elevation: pressed ? 2 : (style as any)?.elevation || 0
          }
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface CardProps {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AnimatedCard({ delay = 0, style, children }: CardProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 9,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[
      styles.baseCard,
      style, 
      { 
        opacity: opacityAnim, 
        transform: [{ translateY: translateYAnim }] 
      }
    ]}>
      {children}
    </Animated.View>
  );
}

export function AnimatedShapes() {
  const { theme, isDarkMode } = useTheme();
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloatingAnim = (anim: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    };

    createFloatingAnim(anim1, 16000).start();
    createFloatingAnim(anim2, 19000).start();
  }, []);

  const trans1 = {
    translateX: anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }),
    translateY: anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
    scale: anim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }),
  };

  const trans2 = {
    translateX: anim2.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }),
    translateY: anim2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }),
    scale: anim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
  };

  return (
    <View style={StyleSheet.absoluteFill}>
       <Animated.View style={[
         styles.shape, 
         styles.shape1, 
         { backgroundColor: theme.primaryContainer, opacity: isDarkMode ? 0.12 : 0.25, transform: [ { translateX: trans1.translateX }, { translateY: trans1.translateY }, { scale: trans1.scale } ] }
       ]} />
       <Animated.View style={[
         styles.shape, 
         styles.shape2, 
         { backgroundColor: theme.secondaryContainer, opacity: isDarkMode ? 0.08 : 0.20, transform: [ { translateX: trans2.translateX }, { translateY: trans2.translateY }, { scale: trans2.scale } ] }
       ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  shape: { position: 'absolute', borderRadius: 999 },
  shape1: { width: 400, height: 400, top: -120, right: -120 },
  shape2: { width: 500, height: 500, bottom: -180, left: -180 },
});
