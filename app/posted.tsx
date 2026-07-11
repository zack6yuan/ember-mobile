import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { Ember, EmberGradient, Radius } from '@/constants/theme';

export default function PostedScreen() {
  const router = useRouter();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 0.9]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  const backToHearth = () => {
    router.dismissAll();
  };

  return (
    <LinearGradient
      colors={['rgba(240,120,40,0.30)', 'transparent']}
      locations={[0, 0.6]}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
          <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.tile}>
            <Text style={styles.flame}>🔥</Text>
          </LinearGradient>
        </View>

        <Text serif style={styles.h1}>
          It&apos;s out there now.
        </Text>
        <Text style={styles.body}>
          Your words are with people who get it. Rest easy — we&apos;ll let you know when someone reaches back.
        </Text>

        <Text style={styles.button} onPress={backToHearth}>
          Back to the hearth
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 40,
    backgroundColor: 'rgba(255,138,61,0.45)',
  },
  tile: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f07828',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 30,
  },
  flame: { fontSize: 44 },
  h1: { fontSize: 30, lineHeight: 36, color: Ember.textPrimary, textAlign: 'center', marginBottom: 14 },
  body: { color: Ember.textSecondary, fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 34 },
  button: {
    backgroundColor: Ember.surface3,
    color: Ember.reactionWarm,
    fontWeight: '700',
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: Radius.button,
    overflow: 'hidden',
  },
});
