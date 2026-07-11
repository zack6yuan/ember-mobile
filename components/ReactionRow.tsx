import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';
import { usePosts, type Post } from '@/store/PostsContext';

/** Muted 🫂 / ❤️ / 💬 counts shown on feed cards. Hug & heart toggle optimistically. */
export function ReactionRow({ post, onReply }: { post: Post; onReply?: () => void }) {
  const { toggleHug, toggleHeart } = usePosts();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => toggleHug(post.id)}
        hitSlop={8}
        style={styles.item}
        activeOpacity={0.7}
      >
        <Text style={[styles.count, post.myHug && styles.active]}>🫂 {post.hugs}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => toggleHeart(post.id)}
        hitSlop={8}
        style={styles.item}
        activeOpacity={0.7}
      >
        <Text style={[styles.count, post.myHeart && styles.activeHeart]}>❤️ {post.hearts}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onReply} hitSlop={8} style={styles.item} activeOpacity={0.7}>
        <Text style={styles.count}>💬 {post.replies.length}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, marginTop: 12 },
  item: {},
  count: { color: '#9a8a80', fontSize: 13 },
  active: { color: Ember.reactionWarm },
  activeHeart: { color: Ember.ember },
});
