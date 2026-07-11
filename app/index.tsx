import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { Ember, EmberGradient } from '@/constants/theme';

const { width } = Dimensions.get('window');

/** A single ember that rises, fades, and shrinks — looping with a stagger. */
function EmberParticle({
  left,
  bottom,
  size,
  color,
  duration,
  delay,
}: {
  left: number;
  bottom: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.ease) }), -1, false));
  }, [p, duration, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -190]) },
      { scale: interpolate(p.value, [0, 1], [1, 0.4]) },
    ],
    opacity: interpolate(p.value, [0, 0.15, 0.8, 1], [0, 1, 0.8, 0]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: size,
        },
        style,
      ]}
    />
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Glow pulse behind the logo.
  const pulse = useSharedValue(0);
  // Flame flicker on the logo tile.
  const flicker = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.ease) }), -1, true);
    flicker.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse, flicker]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.5, 0.85]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.06]) }],
  }));

  const flickerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(flicker.value, [0, 1], [-2, 2])}deg` },
      { scale: interpolate(flicker.value, [0, 1], [1, 1.05]) },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Ambient hearth glow rising from the bottom edge */}
      <LinearGradient
        colors={['transparent', 'rgba(232,90,42,0.10)', 'rgba(255,150,60,0.30)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.bottomHalo} pointerEvents="none" />

      {/* Floating embers */}
      <EmberParticle left={width * 0.24} bottom={140} size={5} color="#ffb073" duration={5500} delay={0} />
      <EmberParticle left={width * 0.52} bottom={110} size={4} color="#ffce9a" duration={6800} delay={1400} />
      <EmberParticle left={width * 0.7} bottom={150} size={6} color="#ff9b52" duration={5000} delay={2600} />
      <EmberParticle left={width * 0.38} bottom={120} size={3} color="#ffd9b0" duration={7400} delay={700} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.logoGlow, pulseStyle]} pointerEvents="none" />
          <Animated.View style={flickerStyle}>
            <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.logoTile}>
              <Text style={styles.logoFlame}>🔥</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.eyebrow}>EMBER</Text>
        <Text serif style={styles.h1}>
          A warm place{'\n'}to be{' '}
          <Text serif italic style={styles.h1Accent}>
            heard
          </Text>
          .
        </Text>
        <Text style={styles.subtitle}>
          Celebrate the small wins. Set down what&apos;s heavy. Someone is always listening.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton label="Get started" onPress={() => router.push('/onboarding')} />
        <SecondaryButton label="I already have an account" onPress={() => router.replace('/(tabs)/feed')} />
        <Text style={styles.footnote}>🌙 Stay anonymous or share your name — always your choice.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bgDeep },
  bottomHalo: {
    position: 'absolute',
    left: '50%',
    marginLeft: -170,
    bottom: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,138,61,0.16)',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap: { marginBottom: 34, alignItems: 'center', justifyContent: 'center' },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 34,
    backgroundColor: 'rgba(255,138,61,0.45)',
  },
  logoTile: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f07828',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
  },
  logoFlame: { fontSize: 42 },
  eyebrow: {
    color: Ember.ember,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 16,
  },
  h1: {
    fontSize: 40,
    lineHeight: 44,
    color: Ember.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  h1Accent: { color: Ember.emberLight },
  subtitle: {
    color: Ember.textSecondaryAlt,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: { paddingHorizontal: 24, gap: 10 },
  footnote: {
    color: '#8a7a70',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});
