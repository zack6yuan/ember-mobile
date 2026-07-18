import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { REACTIONS } from '@/lib/reactions';
import { usePosts, type Post } from '@/store/PostsContext';

/**
 * The warmth palette shown on a feed card: every reaction is tappable and toggles
 * optimistically; a count appears once it's above zero. Reply count sits at the end.
 */
export function ReactionRow({ post, onReply }: { post: Post; onReply?: () => void }) {
  const { toggleReaction } = usePosts();

  return (
    <View style={styles.row}>
      {REACTIONS.map((r) => {
        const count = post.reactions[r.id] ?? 0;
        const mine = post.myReactions[r.id];
        return (
          <TouchableOpacity
            key={r.id}
            onPress={() => toggleReaction(post.id, r.id)}
            hitSlop={6}
            style={styles.item}
            activeOpacity={0.7}
          >
            <Text style={[styles.count, mine && { color: r.color }]}>
              {r.emoji}
              {count > 0 ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onReply} hitSlop={6} style={styles.item} activeOpacity={0.7}>
        <Text style={styles.count}>💬 {post.replies.length}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  item: {},
  count: { color: '#9a8a80', fontSize: 13 },
});
