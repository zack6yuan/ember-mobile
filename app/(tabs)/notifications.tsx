import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';

type Warmth = {
  id: string;
  emoji: string;
  pre?: string;
  lead: string;
  leadColor?: string;
  post?: string;
  context: string;
};

const WARMTH: Warmth[] = [
  { id: '1', emoji: '🫂', lead: '34 people', post: ' sent a hug on your post', context: '“Third night I can’t sleep…” · 4m' },
  { id: '2', emoji: '💬', lead: '@leo', leadColor: Ember.ember, post: ' replied: “Sitting with you tonight.”', context: '1m ago' },
  { id: '3', emoji: '❤️', lead: '51 hearts', post: ' on your win in #wins', context: '20m ago' },
  { id: '4', emoji: '🕯️', pre: 'Someone you comforted said ', lead: 'thank you', context: '1h ago' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text serif style={styles.title}>
          Warmth for you
        </Text>
      </View>

      <FlatList
        data={WARMTH}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.content}>
              <Text style={styles.message}>
                {item.pre}
                <Text style={[styles.lead, { color: item.leadColor ?? Ember.textPrimary }]}>{item.lead}</Text>
                {item.post}
              </Text>
              <Text style={styles.context}>{item.context}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 26, color: Ember.textPrimary },
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 170 },
  divider: { height: 1, backgroundColor: Ember.border },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 8 },
  emoji: { fontSize: 18 },
  content: { flex: 1 },
  message: { color: Ember.textBody, fontSize: 13, lineHeight: 20 },
  lead: { fontWeight: '700' },
  context: { color: Ember.textMutedDeep, fontSize: 12, marginTop: 4 },
});
