import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { ReactionButton } from '@/components/ReactionButton';
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
        return (
          <ReactionButton
            key={r.id}
            emoji={r.emoji}
            label={count > 0 ? String(count) : ''}
            active={post.myReactions[r.id]}
            activeColor={r.color}
            onToggle={() => toggleReaction(post.id, r.id)}
            textStyle={styles.count}
          />
        );
      })}
      <TouchableOpacity onPress={onReply} hitSlop={6} activeOpacity={0.7}>
        <Text style={styles.count}>💬 {post.replies.length}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  count: { color: '#9a8a80', fontSize: 13 },
});
