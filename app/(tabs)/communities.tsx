import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, type Community } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';

export default function CommunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { communities, setActiveTag } = usePosts();
  const { session, joinCircle, leaveCircle } = useUser();

  const joined = session?.joinedCircles ?? [];

  const openCommunity = (c: Community) => {
    setActiveTag(c.tag);
    router.navigate('/(tabs)/feed');
  };

  const toggleMembership = (c: Community, isJoined: boolean) => {
    Haptics.selectionAsync();
    if (isJoined) leaveCircle(c.tag);
    else joinCircle(c.tag);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text serif style={styles.title}>
          Communities
        </Text>
      </View>

      <FlatList
        data={communities}
        keyExtractor={(item) => item.tag}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const isJoined = joined.includes(item.tag);
          return (
            <View style={styles.row}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.rowMain}
                onPress={() => openCommunity(item)}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                  <Text style={styles.count}>{item.count.toLocaleString()} here</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.joinBtn, isJoined && styles.joinBtnActive]}
                onPress={() => toggleMembership(item, isJoined)}
              >
                {isJoined && <Ionicons name="checkmark" size={13} color={Ember.textSecondary} />}
                <Text style={[styles.joinLabel, isJoined && styles.joinLabelActive]}>
                  {isJoined ? 'Joined' : 'Join'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 26, color: Ember.textPrimary },
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 170 },
  row: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.cardSmall,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  emoji: { fontSize: 22 },
  info: { flex: 1 },
  name: { color: Ember.textPrimary, fontWeight: '700', fontSize: 15 },
  desc: { color: Ember.textMutedDeep, fontSize: 12, marginTop: 2 },
  count: { color: Ember.textMuted, fontSize: 12, marginTop: 6 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.55)',
    backgroundColor: 'rgba(240,130,74,0.12)',
  },
  joinBtnActive: {
    borderColor: Ember.borderStrong,
    backgroundColor: Ember.surface3,
  },
  joinLabel: { color: Ember.ember, fontSize: 13, fontWeight: '700' },
  joinLabelActive: { color: Ember.textSecondary },
});
