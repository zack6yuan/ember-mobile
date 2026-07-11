import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, EmberGradient, Radius } from '@/constants/theme';
import { usePosts, type Post } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';

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
  const { session } = useUser();
  const { myPosts, savedPosts } = usePosts();
  const [tab, setTab] = useState<'mine' | 'saved'>('mine');

  const data = tab === 'mine' ? myPosts() : savedPosts();
  const initial = session.handle.charAt(0).toUpperCase();

  const header = (
    <View>
      <View style={styles.identity}>
        <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </LinearGradient>
        <Text serif style={styles.handle}>
          @{session.handle}
        </Text>
        <Text style={styles.meta}>
          Here since {session.memberSince} · {session.embersShared} embers shared
        </Text>
      </View>

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
          <Text style={styles.empty}>
            {tab === 'saved' ? 'Nothing saved yet. Tap “save” on a post that stays with you.' : 'No posts yet.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  list: { paddingHorizontal: 18, paddingBottom: 170 },
  identity: { alignItems: 'center', paddingTop: 16, paddingBottom: 10 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f07828',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  avatarInitial: { color: Ember.onGradient, fontSize: 28, fontWeight: '700' },
  handle: { fontSize: 22, color: Ember.textPrimary },
  meta: { color: Ember.textMutedDeep, fontSize: 13, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
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
  empty: { color: Ember.textMuted, fontSize: 14, lineHeight: 22, textAlign: 'center', paddingTop: 40, paddingHorizontal: 20 },
});
