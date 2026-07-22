import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { ReactionButton } from '@/components/ReactionButton';
import { REACTIONS } from '@/lib/reactions';
import { compactCount } from '@/lib/format';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, type Post } from '@/store/PostsContext';

/**
 * The warmth palette shown on a feed card: every reaction is a tappable pill that
 * toggles optimistically. The count appears once it's above zero; reacting tints
 * the chip with an ember border. Mirrors the post-detail chip treatment so the
 * two screens read the same. Reply count sits at the end as a matching pill.
 */
export function ReactionRow({ post, onReply }: { post: Post; onReply?: () => void }) {
  const { toggleReaction } = usePosts();

  return (
    <View style={styles.row}>
      {REACTIONS.map((r) => {
        const count = post.reactions[r.id] ?? 0;
        const mine = post.myReactions[r.id];
        return (
          <ReactionButton
            key={r.id}
            emoji={r.emoji}
            label={count > 0 ? compactCount(count) : ''}
            active={mine}
            activeColor={r.color}
            onToggle={() => toggleReaction(post.id, r.id)}
            containerStyle={[styles.chip, mine && styles.chipActive]}
            textStyle={styles.chipText}
          />
        );
      })}
      <TouchableOpacity onPress={onReply} hitSlop={6} activeOpacity={0.7} style={styles.chip}>
        <Text style={styles.chipText}>💬{post.replies.length > 0 ? ` ${compactCount(post.replies.length)}` : ''}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  // Emoji pill. Transparent border by default so the active state can light it up
  // without shifting the chip's size. Sized to keep all reactions + the reply
  // count on a single line even when every one is selected (counts showing).
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Ember.surface3,
    borderRadius: Radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: Ember.ember, backgroundColor: Ember.surfaceSelected },
  chipText: { color: Ember.reactionWarm, fontSize: 13 },
});
