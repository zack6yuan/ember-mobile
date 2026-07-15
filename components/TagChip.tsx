import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Ember, EmberGradientAlt, Radius } from '@/constants/theme';

/** Pill tag/community chip. Active = ember gradient, inactive = surface3. */
export function TagChip({
  label,
  active,
  onPress,
  small,
  style,
  onLayout,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const padV = small ? 6 : 7;
  const padH = small ? 12 : 14;
  const fontSize = small ? 12 : 13;

  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={style} onLayout={onLayout}>
        <LinearGradient
          colors={EmberGradientAlt}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={[styles.chip, { paddingVertical: padV, paddingHorizontal: padH }]}
        >
          <Text style={[styles.label, { color: Ember.onGradient, fontSize }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, styles.inactive, { paddingVertical: padV, paddingHorizontal: padH }, style]}
      onLayout={onLayout}
    >
      <Text style={[styles.label, { color: Ember.textSecondary, fontSize }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: Radius.chip, alignItems: 'center', justifyContent: 'center' },
  inactive: { backgroundColor: Ember.surface3 },
  label: { fontWeight: '700' },
});
