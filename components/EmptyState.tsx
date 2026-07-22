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

type Props = {
  /** Focal glyph shown inside the ember disk (e.g. an emoji). */
  glyph: string;
  /** Optional serif headline above the body copy. */
  title?: string;
  body: string;
  /** Fill and vertically center the parent (for full-screen empty lists). */
  fill?: boolean;
};

/**
 * A warm ember illustration for empty states: a softly breathing glow behind
 * concentric warmth rings and a gradient ember disk, with supportive copy.
 * Built from Views + gradients (no SVG) so it matches the rest of the app.
 */
export function EmptyState({ glyph, title, body, fill = false }: Props) {
  // Gentle breathing on the outer glow — the hearth is alive, just quiet.
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + glow.value * 0.35,
    transform: [{ scale: 0.9 + glow.value * 0.18 }],
  }));

  return (
    <View style={[styles.wrap, fill && styles.fill]}>
      <View style={styles.art}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <LinearGradient
              colors={EmberGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.disk}
            >
              <Text style={styles.glyph}>{glyph}</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
      {title ? (
        <Text serif style={styles.title}>
          {title}
        </Text>
      ) : null}
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 44, gap: 14 },
  fill: { flex: 1, justifyContent: 'center', paddingVertical: 0 },
  art: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(240,130,74,0.18)',
  },
  ringOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disk: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  glyph: { fontSize: 26 },
  title: { fontSize: 22, color: Ember.textPrimary, textAlign: 'center' },
  body: { color: Ember.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 300 },
});
