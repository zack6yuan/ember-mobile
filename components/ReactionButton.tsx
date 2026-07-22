import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleProp, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

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
 * A tappable reaction. A light haptic confirms the tap; the emoji and count stay
 * at their resting size — no scale/pop. Shared by the feed card, post detail, and
 * reply rows.
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
  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle();
  };

  return (
    <TouchableOpacity onPress={press} hitSlop={hitSlop} activeOpacity={0.7} style={containerStyle}>
      <Text style={[textStyle, active && { color: activeColor }]}>
        {emoji}
        {label ? ` ${label}` : ''}
      </Text>
    </TouchableOpacity>
  );
}
