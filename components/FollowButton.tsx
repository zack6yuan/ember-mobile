import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';
import { usePosts } from '@/store/PostsContext';

/** Follow / Following toggle for a named author, keyed by handle. */
export function FollowButton({ handle, size = 'md' }: { handle: string; size?: 'sm' | 'md' }) {
  const { isFollowing, followAuthor, unfollowAuthor } = usePosts();
  const following = isFollowing(handle);
  const small = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => (following ? unfollowAuthor(handle) : followAuthor(handle))}
      style={[styles.btn, small && styles.btnSm, following && styles.following]}
    >
      {following && <Ionicons name="checkmark" size={small ? 11 : 13} color={Ember.textSecondary} />}
      <Text style={[styles.label, small && styles.labelSm, following && styles.labelFollowing]}>
        {following ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.55)',
    backgroundColor: 'rgba(240,130,74,0.12)',
  },
  btnSm: { paddingHorizontal: 11, height: 26, borderRadius: 13 },
  following: { borderColor: Ember.borderStrong, backgroundColor: Ember.surface3 },
  label: { color: Ember.ember, fontSize: 13, fontWeight: '700' },
  labelSm: { fontSize: 12 },
  labelFollowing: { color: Ember.textSecondary },
});
