import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { AuthorRow } from '@/components/AuthorRow';
import { ReactionRow } from '@/components/ReactionRow';
import { Ember, Radius } from '@/constants/theme';
import { displayName } from '@/lib/identity';
import { presentModerationMenu } from '@/lib/moderation';
import { usePosts } from '@/store/PostsContext';

/** A post as it appears in the feed: author row, body, reaction counts. */
export function PostCard({ id }: { id: string }) {
  const router = useRouter();
  const { getPost, reportPost, blockAuthor } = usePosts();
  const post = getPost(id);
  if (!post) return null;

  const openDetail = () => router.push({ pathname: '/post/[id]', params: { id } });

  // Report/block is only meaningful for other people's posts.
  const canModerate = !post.mine && !!post.authorUid;
  const openMenu = () =>
    presentModerationMenu({
      targetLabel: 'post',
      onReport: (reason) => reportPost(post.id, reason),
      onBlock: () => blockAuthor(post.authorUid!, displayName(post.author)),
    });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={openDetail} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headMain}>
          <AuthorRow identity={post.author} time={post.createdAt} avatarSize={24} />
        </View>
        {canModerate && (
          <TouchableOpacity onPress={openMenu} hitSlop={10} style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={16} color={Ember.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.body}>{post.body}</Text>
      <ReactionRow post={post} onReply={openDetail} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.card,
    padding: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  headMain: { flex: 1 },
  menuBtn: { paddingLeft: 8 },
  body: {
    color: Ember.textBody,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
});
