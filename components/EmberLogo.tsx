import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Ember, EmberGradientAlt } from '@/constants/theme';

/** Flame logo tile + optional "Ember" wordmark (Newsreader). */
export function EmberLogo({ size = 26, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={EmberGradientAlt}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={[styles.tile, { width: size, height: size, borderRadius: size * 0.34 }]}
      >
        <Text style={{ fontSize: Math.round(size * 0.54) }}>🔥</Text>
      </LinearGradient>
      {showWordmark ? (
        <Text serif style={styles.wordmark}>
          Ember
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f07828',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  wordmark: { fontSize: 22, color: Ember.textPrimary },
});
