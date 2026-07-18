import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';

/**
 * A gentle, dismissible support card surfaced when text shows signs of distress.
 * Warm and non-clinical by design — it offers help, it never warns or blocks.
 * Resources are US-first (988) with an international fallback.
 */
export function CrisisCard({ onDismiss }: { onDismiss?: () => void }) {
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>🕯️ You’re not alone</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={10}>
            <Ionicons name="close" size={16} color={Ember.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.body}>
        It sounds like you’re carrying something really heavy right now. You deserve support — you can talk to
        someone who’ll listen, any time. It’s free and confidential.
      </Text>

      <TouchableOpacity style={styles.primary} activeOpacity={0.85} onPress={() => open('tel:988')}>
        <Ionicons name="call" size={15} color={Ember.onGradient} />
        <Text style={styles.primaryText}>Call 988 · Suicide & Crisis Lifeline</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} activeOpacity={0.85} onPress={() => open('sms:988')}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={Ember.ember} />
        <Text style={styles.secondaryText}>Text 988 instead</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => open('https://findahelpline.com')} hitSlop={6}>
        <Text style={styles.note}>Outside the US? Find a helpline near you →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.35)',
    borderRadius: Radius.card,
    padding: 16,
    gap: 10,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Ember.emberLight, fontSize: 15, fontWeight: '700' },
  body: { color: Ember.textSecondary, fontSize: 13, lineHeight: 20 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Ember.ember,
    borderRadius: Radius.button,
    paddingVertical: 12,
    marginTop: 2,
  },
  primaryText: { color: Ember.onGradient, fontSize: 14, fontWeight: '700' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secondaryText: { color: Ember.ember, fontSize: 13, fontWeight: '600' },
  note: { color: Ember.textMutedDeep, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
