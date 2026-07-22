import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { EmptyState } from '@/components/EmptyState';
import { PresetAvatar } from '@/components/Avatar';
import { ProfileHearth } from '@/components/ProfileHearth';
import { Milestones } from '@/components/Milestones';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, type Post } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';
import { useAuth } from '@/store/AuthContext';

function sharedAs(post: Post): string {
  return post.author.mode === 'named' && post.author.handle
    ? `shared as @${post.author.handle}`
    : '🌙 anonymous';
}

function MyPostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.postCard} onPress={onPress}>
      <View style={styles.postMeta}>
        <Text style={styles.postTag}>#{post.tag}</Text>
        <Text style={styles.postShared}>· {sharedAs(post)}</Text>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, moods } = useUser();
  const { signOut } = useAuth();
  const { myPosts, savedPosts } = usePosts();
  const [tab, setTab] = useState<'mine' | 'saved'>('mine');

  const minePosts = myPosts();
  const data = tab === 'mine' ? minePosts : savedPosts();
  // "People held" = total warmth your posts have received across every reaction.
  const peopleHeld = minePosts.reduce(
    (sum, p) => sum + Object.values(p.reactions).reduce((a, b) => a + b, 0),
    0
  );
  const milestoneStats = {
    embersShared: session?.embersShared ?? 0,
    longestStreak: session?.longestStreak ?? 0,
    peopleHeld,
  };
  const handle = session?.handle ?? '';
  const initial = handle.charAt(0).toUpperCase();

  const onSignOut = () => {
    Alert.alert('Sign out?', 'Your embers will be here when you come back.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const header = (
    <View>
      <View style={styles.identity}>
        <View style={styles.identityRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={() => router.push('/edit-profile')}
          >
            <PresetAvatar presetId={session?.avatar} imageUrl={session?.avatarUrl} initial={initial} size={64} />
          </TouchableOpacity>
          <View style={styles.identityText}>
            <Text serif style={styles.handle}>
              @{handle}
            </Text>
            <Text style={styles.meta}>
              Here since {session?.memberSince ?? '—'} · {session?.embersShared ?? 0} ember
              {(session?.embersShared ?? 0) === 1 ? '' : 's'} shared
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.action} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={Ember.textMuted} />
            <Text style={styles.actionText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/journal')} style={styles.action} activeOpacity={0.8}>
            <Ionicons name="book-outline" size={16} color={Ember.textMuted} />
            <Text style={styles.actionText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/breathe')} style={styles.action} activeOpacity={0.8}>
            <Ionicons name="leaf-outline" size={16} color={Ember.textMuted} />
            <Text style={styles.actionText}>Breathe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/blocked')} style={styles.action} activeOpacity={0.8}>
            <Ionicons name="shield-outline" size={16} color={Ember.textMuted} />
            <Text style={styles.actionText}>Blocked</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut} style={styles.action} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color={Ember.textMuted} />
            <Text style={styles.actionText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ProfileHearth
        streak={session?.streak ?? 0}
        longestStreak={session?.longestStreak ?? 0}
        embersShared={session?.embersShared ?? 0}
        moods={moods}
      />

      <Milestones stats={milestoneStats} />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')} activeOpacity={0.8}>
          <Text style={[styles.tabText, tab === 'mine' ? styles.tabTextActive : styles.tabTextIdle]}>My posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'saved' && styles.tabActive]} onPress={() => setTab('saved')} activeOpacity={0.8}>
          <Text style={[styles.tabText, tab === 'saved' ? styles.tabTextActive : styles.tabTextIdle]}>Saved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <MyPostCard post={item} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          tab === 'saved' ? (
            <EmptyState
              glyph="🔖"
              title="Nothing saved yet"
              body="Tap “save” on a post that stays with you, and it’ll be waiting here."
            />
          ) : (
            <EmptyState
              glyph="🔥"
              title="No embers yet"
              body="The posts you share will gather here — a small record of showing up."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  list: { paddingHorizontal: 18, paddingBottom: 170 },
  identity: { alignItems: 'stretch', paddingTop: 16, paddingBottom: 10 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, marginTop: 14 },
  avatarWrap: {
    borderRadius: 32,
    shadowColor: '#f07828',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  handle: { fontSize: 22, color: Ember.textPrimary },
  meta: { color: Ember.textMutedDeep, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Ember.border,
    backgroundColor: Ember.surface3,
  },
  actionText: { color: Ember.textMuted, fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8, paddingVertical: 12, marginTop: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.segment },
  tabActive: { backgroundColor: Ember.surface3 },
  tabText: { fontSize: 13 },
  tabTextActive: { color: Ember.textPrimary, fontWeight: '700' },
  tabTextIdle: { color: Ember.textMuted, fontWeight: '600' },
  postCard: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.cardSmall,
    padding: 14,
  },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  postTag: { color: Ember.ember, fontSize: 11, fontWeight: '700' },
  postShared: { color: Ember.textMutedDeep, fontSize: 11 },
  postBody: { color: Ember.textBody, fontSize: 13, lineHeight: 20 },
});
