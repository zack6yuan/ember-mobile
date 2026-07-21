import React, { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ember, Radius } from '@/constants/theme';

/** A single placeholder "bone". Width can be a number or a percentage string. */
function Bone({ w, h = 12, style }: { w: DimensionValue; h?: number; style?: object }) {
  return <View style={[styles.bone, { width: w, height: h, borderRadius: h / 2 }, style]} />;
}

/**
 * Loading placeholder that mirrors {@link PostCard}'s layout — avatar, author
 * line, three body lines and a row of reaction pills — so the feed keeps its
 * shape while posts load, then swaps in without a jump. The whole card breathes
 * with one shared pulse (cheaper than animating each bone, and reads calmer).
 */
export function PostCardSkeleton() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const breathe = useAnimatedStyle(() => ({ opacity: 0.4 + pulse.value * 0.45 }));

  return (
    <View style={styles.card}>
      <Animated.View style={breathe}>
        <View style={styles.head}>
          <View style={styles.avatar} />
          <View style={styles.headLines}>
            <Bone w={96} h={11} />
            <Bone w={52} h={8} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={styles.body}>
          <Bone w="92%" />
          <Bone w="82%" style={{ marginTop: 8 }} />
          <Bone w="55%" style={{ marginTop: 8 }} />
        </View>
        <View style={styles.reactions}>
          {[44, 44, 44, 44, 30].map((w, i) => (
            <View key={i} style={[styles.pill, { width: w }]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/** A short column of {@link PostCardSkeleton}s for the initial feed load. */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  card: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.card,
    padding: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Ember.surface3 },
  headLines: { flex: 1 },
  body: { marginTop: 12 },
  bone: { backgroundColor: Ember.surface3 },
  reactions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  pill: { height: 26, borderRadius: 13, backgroundColor: Ember.surface3 },
});
