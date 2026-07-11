import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Ember, EmberGradient, Radius } from '@/constants/theme';

/** Primary ember-gradient CTA with the design's warm glow shadow. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.9} style={[styles.shadow, style, disabled && styles.disabled]}>
      <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.inner}>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/** Secondary bordered button (calm, low emphasis). */
export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.secondary, style]}>
      <Text style={styles.secondaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Radius.buttonLg,
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  disabled: { opacity: 0.5, shadowOpacity: 0 },
  inner: {
    paddingVertical: 17,
    borderRadius: Radius.buttonLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: Ember.onGradient, fontWeight: '700', fontSize: 16 },
  secondary: {
    paddingVertical: 13,
    borderRadius: Radius.buttonLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Ember.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  secondaryLabel: { color: '#dcccc0', fontWeight: '600', fontSize: 15 },
});
