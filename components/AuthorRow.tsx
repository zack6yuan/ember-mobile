import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Ember } from '@/constants/theme';
import { displayName } from '@/lib/identity';
import type { Identity } from '@/store/PostsContext';

/** avatar + name + "· time" row used on cards, post detail and replies. */
export function AuthorRow({
  identity,
  time,
  avatarSize = 24,
  tag,
}: {
  identity: Identity;
  time: string;
  avatarSize?: number;
  tag?: string; // optional accent suffix, e.g. "#gratitude"
}) {
  return (
    <View style={styles.row}>
      <Avatar identity={identity} size={avatarSize} />
      <Text style={styles.name}>{displayName(identity)}</Text>
      <Text style={styles.time}>· {time}</Text>
      {tag ? <Text style={styles.tag}>· {tag}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#e9d9cd', fontSize: 13, fontWeight: '600' },
  time: { color: Ember.textMutedDeep, fontSize: 12 },
  tag: { color: Ember.ember, fontSize: 11 },
});
