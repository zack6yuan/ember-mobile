import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { EmptyState } from '@/components/EmptyState';
import { Ember, Radius } from '@/constants/theme';
import { usePosts } from '@/store/PostsContext';

export default function BlockedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { blocked, unblockAuthor } = usePosts();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
        <Text serif style={styles.title}>
          Blocked people
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={blocked}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={blocked.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState
            fill
            glyph="🛡️"
            title="Your space is clear"
            body="You haven’t blocked anyone. If someone’s posts or replies aren’t for you, block them and they’ll disappear from your view."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.unblockBtn}
              onPress={() => unblockAuthor(item.uid)}
            >
              <Text style={styles.unblockLabel}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, color: Ember.textPrimary },
  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  emptyList: { flexGrow: 1, paddingHorizontal: 18 },
  row: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.cardSmall,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: { flex: 1, color: Ember.textPrimary, fontSize: 15, fontWeight: '600' },
  unblockBtn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Ember.borderStrong,
    backgroundColor: Ember.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockLabel: { color: Ember.textSecondary, fontSize: 13, fontWeight: '700' },
});
