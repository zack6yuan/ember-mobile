import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { Ember, EmberGradient } from '@/constants/theme';
import { moodById } from '@/lib/moods';
import type { MoodEntry } from '@/store/UserContext';

type Props = {
  streak: number;
  longestStreak: number;
  embersShared: number;
  /** Mood check-ins, newest first (as stored). */
  moods: MoodEntry[];
};

const BOX = 184;
const CENTER = BOX / 2;
const RING_R = 74; // radius the mood dots sit on
const DOT = 13;
const MAX_DOTS = 12;

/**
 * The profile centerpiece: a hearth whose glow grows with the person's streak and
 * embers shared, encircled by a ring of their recent moods (cool → warm tints).
 * Built from Views + gradients (no SVG) to match {@link EmptyState} and the rest
 * of the app. The glow breathes gently so the hearth always feels alive.
 */
export function ProfileHearth({ streak, longestStreak, embersShared, moods }: Props) {
  // How lit the hearth is: mostly streak, with a little lift from posts shared.
  const intensity = Math.min(1, (streak / 21) * 0.7 + (embersShared / 20) * 0.3);

  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [breath]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + intensity * 0.4 + breath.value * 0.14,
    transform: [{ scale: 0.82 + intensity * 0.22 + breath.value * 0.1 }],
  }));

  // Recent check-ins, oldest → newest, placed clockwise from the top of the ring.
  const recent = moods.slice(0, MAX_DOTS).reverse();

  return (
    <View style={styles.wrap}>
      <View style={styles.art}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={styles.ring} />

        {recent.map((entry, i) => {
          const angle = ((-90 + (360 / recent.length) * i) * Math.PI) / 180;
          const cx = CENTER + RING_R * Math.cos(angle);
          const cy = CENTER + RING_R * Math.sin(angle);
          const tint = moodById(entry.mood)?.tint ?? Ember.textMuted;
          return (
            <View
              key={entry.date}
              style={[styles.dot, { left: cx - DOT / 2, top: cy - DOT / 2, backgroundColor: tint }]}
            />
          );
        })}

        <LinearGradient colors={EmberGradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.disk}>
          {streak > 0 ? (
            <>
              <Text serif style={styles.diskNum}>
                {streak}
              </Text>
              <Text style={styles.diskUnit}>{streak === 1 ? 'day' : 'days'}</Text>
            </>
          ) : (
            <Text style={styles.diskGlyph}>🔥</Text>
          )}
        </LinearGradient>
      </View>

      <Text style={styles.caption}>
        {streak > 0
          ? `🔥 ${streak}-day streak${longestStreak > streak ? ` · longest ${longestStreak}` : ''}`
          : 'Show up today to start your streak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 4, gap: 12 },
  art: { width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: BOX,
    height: BOX,
    borderRadius: BOX / 2,
    backgroundColor: 'rgba(240,130,74,0.22)',
  },
  ring: {
    position: 'absolute',
    width: RING_R * 2,
    height: RING_R * 2,
    borderRadius: RING_R,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.18)',
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1,
    borderColor: 'rgba(16,11,8,0.55)',
  },
  disk: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 9,
  },
  diskNum: { fontSize: 34, color: Ember.onGradient, lineHeight: 38 },
  diskUnit: {
    fontSize: 11,
    color: Ember.onGradient,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -2,
  },
  diskGlyph: { fontSize: 34 },
  caption: { color: Ember.emberLight, fontSize: 13, fontWeight: '700' },
});
