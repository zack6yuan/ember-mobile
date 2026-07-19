import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleProp, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';

type Props = {
  emoji: string;
  /** Text after the emoji (e.g. a count or label); omit/empty for emoji-only. */
  label?: string;
  /** Whether the current user has this reaction on. Drives the active tint. */
  active: boolean;
  /** Tint applied to the label when active. */
  activeColor: string;
  /** Toggle handler — called after the tap feedback fires. */
  onToggle: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hitSlop?: number;
};

/**
 * A tappable reaction that adds the delight: a light haptic on every tap, a spring
 * "pop" on the emoji, and — only when you're turning it on — a small ember copy that
 * floats up and fades. Shared by the feed card, post detail, and reply rows.
 */
export function ReactionButton({
  emoji,
  label,
  active,
  activeColor,
  onToggle,
  containerStyle,
  textStyle,
  hitSlop = 6,
}: Props) {
  const scale = useSharedValue(1);
  const burst = useSharedValue(0); // 0 → 1 drives the floating ember on activate

  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Pop the emoji on every tap; float an ember only when switching on.
    scale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 260 }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );
    if (!active) {
      burst.value = 0;
      burst.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) });
    }
    onToggle();
  };

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value === 0 ? 0 : 1 - burst.value,
    transform: [{ translateY: -24 * burst.value }, { scale: 0.8 + 0.7 * burst.value }],
  }));

  return (
    <TouchableOpacity onPress={press} hitSlop={hitSlop} activeOpacity={0.7} style={containerStyle}>
      <Animated.View style={popStyle}>
        <Text style={[textStyle, active && { color: activeColor }]}>
          {emoji}
          {label ? ` ${label}` : ''}
        </Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.burst, burstStyle]}>
        <Text style={styles.burstEmoji}>{emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', top: -6, left: 0, right: 0, alignItems: 'center' },
  burstEmoji: { fontSize: 15 },
});
