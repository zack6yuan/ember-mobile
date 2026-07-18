import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, EmberGradient } from '@/constants/theme';

// The 4-7-8 pattern: inhale 4s, hold 7s, exhale 8s.
const PHASES = [
  { label: 'Breathe in', ms: 4000 },
  { label: 'Hold', ms: 7000 },
  { label: 'Breathe out', ms: 8000 },
] as const;

export default function BreatheScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.5);
  const [phase, setPhase] = useState(0);

  // Grow on the inhale, hold, then shrink on the exhale — looping forever.
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PHASES[0].ms, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: PHASES[1].ms }),
        withTiming(0.5, { duration: PHASES[2].ms, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);

  // Advance the on-screen cue in step with the animation.
  useEffect(() => {
    const t = setTimeout(() => setPhase((i) => (i + 1) % PHASES.length), PHASES[phase].ms);
    return () => clearTimeout(t);
  }, [phase]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.close} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="close" size={26} color={Ember.textMuted} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, circleStyle]}>
            <LinearGradient
              colors={EmberGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.circleFill}
            />
          </Animated.View>
          <Text serif style={styles.phase}>
            {PHASES[phase].label}
          </Text>
        </View>
      </View>

      <Text style={styles.caption}>Follow the circle. In for four, hold for seven, out for eight.</Text>
    </View>
  );
}

const CIRCLE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bgDeep, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleWrap: { width: CIRCLE, height: CIRCLE, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  },
  circleFill: { flex: 1, borderRadius: CIRCLE / 2, opacity: 0.9 },
  phase: { color: Ember.onGradient, fontSize: 22, fontWeight: '600' },
  caption: {
    color: Ember.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 40,
  },
});
