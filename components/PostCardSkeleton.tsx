import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Ember, Radius } from '@/constants/theme';

// The feed list pads 16px on each side, so a card spans the screen minus 32.
const CARD_WIDTH = Dimensions.get('window').width - 32;
const SWEEP_WIDTH = 150;

/** A single warm highlight that sweeps left→right across a card while loading. */
function Sweep({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -SWEEP_WIDTH + progress.value * (CARD_WIDTH + SWEEP_WIDTH) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.sweep, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(240,130,74,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** A rounded placeholder block standing in for a line of text or a pill. */
function Bar({ width, height = 11, style }: { width: number | string; height?: number; style?: ViewStyle }) {
  return <View style={[styles.bar, { width: width as number, height }, style]} />;
}

function SkeletonCard({ progress, lines }: { progress: SharedValue<number>; lines: (number | string)[] }) {
  return (
    <View style={styles.card}>
      {/* Author row: avatar + name/time */}
      <View style={styles.head}>
        <View style={styles.avatar} />
        <View style={styles.headText}>
          <Bar width={92} height={10} />
          <Bar width={52} height={8} />
        </View>
      </View>
      {/* Body lines */}
      <View style={styles.body}>
        {lines.map((w, i) => (
          <Bar key={i} width={w} height={11} />
        ))}
      </View>
      {/* Reaction pills */}
      <View style={styles.reacts}>
        <Bar width={54} height={28} style={styles.pill} />
        <Bar width={54} height={28} style={styles.pill} />
        <Bar width={54} height={28} style={styles.pill} />
      </View>
      <Sweep progress={progress} />
    </View>
  );
}

// Varied line layouts so the skeleton feed reads like real posts, not a grid.
const ROWS: (number | string)[][] = [
  ['92%', '78%', '58%'],
  ['66%'],
  ['88%', '84%', '72%', '40%'],
];

/** Placeholder feed shown while the first batch of posts loads in. */
export function FeedSkeleton() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  return (
    <View style={styles.wrap}>
      {ROWS.map((lines, i) => (
        <SkeletonCard key={i} progress={progress} lines={lines} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.card,
    padding: 16,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Ember.surface3 },
  headText: { gap: 6 },
  body: { marginTop: 12, gap: 8 },
  reacts: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: { borderRadius: 14 },
  bar: { backgroundColor: Ember.surface3, borderRadius: 6 },
  sweep: { position: 'absolute', top: 0, bottom: 0, width: SWEEP_WIDTH },
});
