import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { EmberLogo } from '@/components/EmberLogo';
import { TagChip } from '@/components/TagChip';
import { PostCard } from '@/components/PostCard';
import { Ember, EmberGradient, Radius } from '@/constants/theme';
import { usePosts, TAG_ORDER } from '@/store/PostsContext';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postsByTag, activeTag, setActiveTag } = usePosts();

  const posts = postsByTag(activeTag);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <EmberLogo size={26} />
        <TouchableOpacity
          style={styles.bell}
          activeOpacity={0.8}
          onPress={() => router.navigate('/(tabs)/notifications')}
        >
          <Ionicons name="notifications-outline" size={16} color={Ember.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tag chips */}
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {TAG_ORDER.map((tag) => (
            <TagChip
              key={tag}
              label={`#${tag}`}
              active={activeTag === tag}
              onPress={() => setActiveTag(tag)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCard id={item.id} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts here yet. Be the first to light one. 🔥</Text>
          </View>
        }
      />

      {/* Compose FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.fab, { bottom: insets.bottom + 88 }]}
        onPress={() => router.push('/compose')}
      >
        <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.fabInner}>
          <Text style={styles.fabIcon}>✍️</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Ember.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: { paddingBottom: 12 },
  chips: { paddingHorizontal: 20, gap: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 170 },
  empty: { paddingTop: 80, paddingHorizontal: 24, alignItems: 'center' },
  emptyText: { color: Ember.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    right: 18,
    borderRadius: Radius.fab,
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: Radius.fab,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 24 },
});
