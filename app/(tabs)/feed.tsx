import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { EmberLogo } from '@/components/EmberLogo';
import { TagChip } from '@/components/TagChip';
import { PostCard } from '@/components/PostCard';
import { FeedSkeleton } from '@/components/PostCardSkeleton';
import { FeedHearth } from '@/components/FeedHearth';
import { EmptyState } from '@/components/EmptyState';
import { Ember, EmberGradient, Radius } from '@/constants/theme';
import { usePosts, TAG_ORDER, type TagId } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';
import { emberGreeting, firstNameFromHandle } from '@/lib/greeting';
import { feedBackdrop } from '@/lib/timeTheme';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postsByTag, activeTag, setActiveTag, forYou, setForYou, forYouPosts, loading, refresh } = usePosts();
  const { session, joinCircle } = useUser();

  const posts = forYou ? forYouPosts() : postsByTag(activeTag);

  // Pull-to-refresh. Data is live, so this is mostly a tactile confirmation.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const streak = session?.streak ?? 0;
  const greeting = emberGreeting(firstNameFromHandle(session?.handle));
  // Background warmth shifts with the hour — deepest and coziest late at night.
  const backdrop = feedBackdrop();

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
      active={!forYou && activeTag === tag}
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
    <LinearGradient
      colors={backdrop}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <EmberLogo size={26} wordmark={greeting} />
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
          <TagChip label="Following" active={forYou} onPress={() => setForYou(true)} />
          <View style={styles.chipDivider} />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Ember.ember}
            colors={[Ember.ember]}
            progressBackgroundColor={Ember.surface}
          />
        }
        ListHeaderComponent={forYou || loading ? null : <FeedHearth />}
        renderItem={({ item }) => <PostCard id={item.id} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          loading ? (
            <FeedSkeleton />
          ) : forYou ? (
            <EmptyState
              glyph="✨"
              title="Your Following feed"
              body="Follow people to fill this feed — tap “Follow” on anyone posting under a name."
            />
          ) : (
            <EmptyState
              glyph="🔥"
              title="Nothing here yet"
              body="Be the first to light one. Share what’s on your mind — someone out there needs to hear it."
            />
          )
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
