import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, type Community } from '@/store/PostsContext';

export default function CommunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { communities, setActiveTag } = usePosts();

  const openCommunity = (c: Community) => {
    setActiveTag(c.tag);
    router.navigate('/(tabs)/feed');
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
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} style={styles.row} onPress={() => openCommunity(item)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
            <Text style={styles.count}>{item.count}</Text>
          </TouchableOpacity>
        )}
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
  emoji: { fontSize: 22 },
  info: { flex: 1 },
  name: { color: Ember.textPrimary, fontWeight: '700', fontSize: 15 },
  desc: { color: Ember.textMutedDeep, fontSize: 12, marginTop: 2 },
  count: { color: '#9a8a80', fontSize: 12 },
});
