import { Text } from '@/components/Text';
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { PostCard } from '@/components/PostCard';
import { usePosts } from '@/store/PostsContext';

export default function FeedScreen() {
  const { colors } = useTheme();
  const { posts } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a network request fetching fresh posts
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.text}
          />
        }
        renderItem={({ item }) => (
          <PostCard id={item.id} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
