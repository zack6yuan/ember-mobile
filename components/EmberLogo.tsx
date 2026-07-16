import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';

const LOGO = require('@/assets/images/ember-logo.png');

/** Flame logo + optional wordmark (Newsreader). Defaults to the "Ember" wordmark. */
export function EmberLogo({
  size = 26,
  showWordmark = true,
  wordmark = 'Ember',
}: {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
}) {
  return (
    <View style={styles.row}>
      <Image
        source={LOGO}
        style={{ width: size, height: size, transform: [{ translateY: -2 }] }}
        contentFit="contain"
      />
      {showWordmark ? (
        <Text serif numberOfLines={1} style={styles.wordmark}>
          {wordmark}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  wordmark: { fontSize: 20, color: Ember.textPrimary, flexShrink: 1 },
});
