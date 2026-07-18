import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';
import { MOODS, moodById } from '@/lib/moods';
import { promptForToday } from '@/lib/prompts';
import { useUser } from '@/store/UserContext';

/**
 * The top of the feed: a gentle daily mood check-in and the day's prompt.
 * Both are low-pressure invitations, not obligations.
 */
export function FeedHearth() {
  const router = useRouter();
  const { todayMood, setTodayMood } = useUser();
  const prompt = promptForToday();
  const checked = moodById(todayMood);

  const pick = (id: string) => {
    Haptics.selectionAsync();
    setTodayMood(id);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.moodCard}>
        <Text style={styles.moodHead}>
          {checked ? `Checked in today · ${checked.emoji} ${checked.label}` : 'How are you arriving today?'}
        </Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.8}
              onPress={() => pick(m.id)}
              style={[styles.moodChip, todayMood === m.id && styles.moodChipActive]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.promptCard}
        onPress={() => router.push({ pathname: '/compose', params: { prompt } })}
      >
        <Text style={styles.promptLabel}>Today’s prompt</Text>
        <Text serif style={styles.promptText}>
          {prompt}
        </Text>
        <Text style={styles.promptCta}>Share a thought →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 12 },
  moodCard: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.cardSmall,
    padding: 14,
    gap: 12,
  },
  moodHead: { color: Ember.textSecondary, fontSize: 13, fontWeight: '600' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  moodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: Radius.segment,
    backgroundColor: Ember.surface3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodChipActive: { borderColor: Ember.ember, backgroundColor: Ember.surfaceSelected },
  moodEmoji: { fontSize: 20 },
  promptCard: {
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.28)',
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
  },
  promptLabel: {
    color: Ember.ember,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  promptText: { color: Ember.textPrimary, fontSize: 18, lineHeight: 25 },
  promptCta: { color: Ember.emberLight, fontSize: 13, fontWeight: '600', marginTop: 2 },
});
