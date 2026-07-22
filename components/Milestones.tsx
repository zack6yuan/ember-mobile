import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';
import { splitMilestones, type MilestoneStats } from '@/lib/milestones';

/**
 * Presence badges on the profile: every milestone the person has earned, lit and
 * warm, followed by the next couple still ahead — shown faded so there's a gentle
 * horizon to walk toward without turning it into a checklist.
 */
export function Milestones({ stats }: { stats: MilestoneStats }) {
  const { earned, ahead } = splitMilestones(stats);
  const shown = [
    ...earned.map((m) => ({ milestone: m, isEarned: true })),
    ...ahead.slice(0, 2).map((m) => ({ milestone: m, isEarned: false })),
  ];
  if (shown.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Milestones</Text>
      <View style={styles.row}>
        {shown.map(({ milestone, isEarned }) => (
          <View key={milestone.id} style={[styles.badge, isEarned ? styles.badgeEarned : styles.badgeLocked]}>
            <Text style={[styles.emoji, !isEarned && styles.emojiLocked]}>{milestone.emoji}</Text>
            <View style={styles.badgeText}>
              <Text style={[styles.title, isEarned ? styles.titleEarned : styles.titleLocked]}>
                {milestone.title}
              </Text>
              <Text style={styles.detail} numberOfLines={2}>
                {milestone.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, gap: 10 },
  label: {
    color: Ember.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeEarned: { backgroundColor: '#20140d', borderColor: 'rgba(240,130,74,0.30)' },
  badgeLocked: { backgroundColor: Ember.surface, borderColor: Ember.border },
  emoji: { fontSize: 22 },
  emojiLocked: { opacity: 0.4 },
  badgeText: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  titleEarned: { color: Ember.textPrimary },
  titleLocked: { color: Ember.textMutedDeep },
  detail: { color: Ember.textMuted, fontSize: 11, marginTop: 1 },
});
