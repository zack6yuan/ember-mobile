import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Ember, EmberGradientAlt } from '@/constants/theme';
import { avatarPreset } from '@/constants/avatars';
import type { Identity } from '@/store/PostsContext';

/**
 * Identity avatar. Anonymous authors get a 🌙 tile; named authors get an
 * ember-gradient tile with their initial.
 */
export function Avatar({ identity, size = 24 }: { identity: Identity; size?: number }) {
  const radius = size / 2;

  if (identity.mode === 'anonymous' || !identity.handle) {
    return (
      <View style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor: Ember.avatarAnon }]}>
        <Text style={{ fontSize: Math.round(size * 0.42) }}>🌙</Text>
      </View>
    );
  }

  const initial = identity.handle.charAt(0).toUpperCase();
  return (
    <LinearGradient
      colors={EmberGradientAlt}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tile, { width: size, height: size, borderRadius: radius }]}
    >
      <Text style={{ color: Ember.onGradient, fontWeight: '700', fontSize: Math.round(size * 0.44) }}>
        {initial}
      </Text>
    </LinearGradient>
  );
}

/**
 * Renders a chosen preset avatar (profile screen + edit screen). Falls back to
 * the handle initial for the `initial` preset (or any preset without a glyph).
 */
export function PresetAvatar({
  presetId,
  initial,
  size = 64,
}: {
  presetId?: string | null;
  initial?: string;
  size?: number;
}) {
  const preset = avatarPreset(presetId);
  return (
    <LinearGradient
      colors={preset.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tile, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {preset.glyph ? (
        <Text style={{ fontSize: Math.round(size * 0.46) }}>{preset.glyph}</Text>
      ) : (
        <Text style={{ color: Ember.onGradient, fontWeight: '700', fontSize: Math.round(size * 0.44) }}>
          {(initial || '').toUpperCase()}
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
