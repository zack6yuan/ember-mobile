import React, { useEffect, useRef } from 'react';
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
import { usePosts, TAG_ORDER, type TagId } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postsByTag, activeTag, setActiveTag } = usePosts();
  const { session, joinCircle } = useUser();

  const posts = postsByTag(activeTag);
  const streak = session?.streak ?? 0;

  // Filter chips: circles you've joined come first (filled), the rest follow
  // (outlined + dimmed) so every circle stays reachable without burying yours.
  const joined = session?.joinedCircles ?? [];
  const joinedTags = TAG_ORDER.filter((t) => joined.includes(t));
  const unjoinedTags = TAG_ORDER.filter((t) => !joined.includes(t));

  // Tapping a joined chip filters; tapping an un-joined one joins it, then filters.
  const selectTag = (tag: TagId) => {
    if (!joined.includes(tag)) joinCircle(tag);
    setActiveTag(tag);
  };

  const renderChip = (tag: TagId) => (
    <TagChip
      key={tag}
      label={`#${tag}`}
      active={activeTag === tag}
      unjoined={!joined.includes(tag)}
      onPress={() => selectTag(tag)}
      onLayout={(e) => {
        chipOffsets.current[tag] = e.nativeEvent.layout.x;
        // On first mount the effect above may run before layout is
        // measured; scroll once the active chip reports its position.
        if (activeTag === tag) scrollActiveIntoView();
      }}
    />
  );

  // Keep the selected chip on screen — e.g. when arriving from the Circles tab
  // with a community far down the list, the row would otherwise stay scrolled
  // to the start with the active chip off-screen.
  const chipScrollRef = useRef<ScrollView>(null);
  const chipOffsets = useRef<Record<string, number>>({});
  const scrollActiveIntoView = () => {
    const x = chipOffsets.current[activeTag];
    if (x != null) chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
  };
  useEffect(scrollActiveIntoView, [activeTag]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <EmberLogo size={26} />
        <View style={styles.headerRight}>
          {streak > 0 && (
            <View style={styles.streakChip}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.bell}
            activeOpacity={0.8}
            onPress={() => router.navigate('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={16} color={Ember.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tag chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          ref={chipScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {joinedTags.map(renderChip)}
          {joinedTags.length > 0 && unjoinedTags.length > 0 && (
            <View style={styles.chipDivider} />
          )}
          {unjoinedTags.map(renderChip)}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: Ember.surface3,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.35)',
  },
  streakText: { color: Ember.emberLight, fontSize: 13, fontWeight: '700' },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Ember.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: { paddingBottom: 12 },
  chips: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chipDivider: { width: 1, height: 22, backgroundColor: Ember.borderStrong, marginHorizontal: 2 },
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
