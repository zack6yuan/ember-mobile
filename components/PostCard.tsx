import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { AuthorRow } from '@/components/AuthorRow';
import { ReactionRow } from '@/components/ReactionRow';
import { Ember, Radius } from '@/constants/theme';
import { usePosts } from '@/store/PostsContext';

/** A post as it appears in the feed: author row, body, reaction counts. */
export function PostCard({ id }: { id: string }) {
  const router = useRouter();
  const { getPost } = usePosts();
  const post = getPost(id);
  if (!post) return null;

  const openDetail = () => router.push({ pathname: '/post/[id]', params: { id } });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={openDetail} style={styles.card}>
      <AuthorRow identity={post.author} time={post.createdAt} avatarSize={24} />
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
  body: {
    color: Ember.textBody,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
});
