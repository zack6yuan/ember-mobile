import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';

/**
 * "Continue with Google" button, styled to match Ember's calm secondary buttons.
 * Shows a spinner in place of its label while the native sheet is resolving.
 */
export function GoogleButton({
  onPress,
  loading,
  disabled,
  label = 'Continue with Google',
  style,
}: {
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      style={[styles.btn, inactive && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={Ember.textSecondary} />
      ) : (
        <View style={styles.row}>
          <Ionicons name="logo-google" size={18} color="#e8ded6" style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    borderRadius: Radius.buttonLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Ember.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10 },
  label: { color: '#dcccc0', fontWeight: '600', fontSize: 15 },
});
