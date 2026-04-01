import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { usePosts } from '@/store/PostsContext';

interface PostCardProps {
  id: string;
}

export function PostCard({ id }: PostCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { posts, setVote } = usePosts();
  
  const post = posts.find(p => p.id === id);

  if (!post) return null;

  const voteStatus = post.voteStatus || 'none';

  const handleUpvote = () => {
    setVote(post.id, voteStatus === 'up' ? 'none' : 'up');
  };

  const handleDownvote = () => {
    setVote(post.id, voteStatus === 'down' ? 'none' : 'down');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'question': return '#00C4CC'; 
      case 'venting': return '#FF3B30';  
      case 'support': return '#AF52DE';  
      case 'success': return '#34C759';  
      case 'humor': return '#FF9500';    
      default: return colors.text;
    }
  };

  const handlePress = () => {
    router.push({
      pathname: '/post/[id]' as any,
      params: { id }
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.voteSidebar}>
        <TouchableOpacity onPress={handleUpvote} hitSlop={{ top: 10, bottom: 5, left: 10, right: 10 }}>
          <Ionicons name="arrow-up-outline" size={24} color={voteStatus === 'up' ? '#34C759' : '#888'} />
        </TouchableOpacity>
        <Text style={[styles.voteCount, { color: voteStatus === 'up' ? '#34C759' : voteStatus === 'down' ? '#FF3B30' : colors.text }]}>{post.upvotes}</Text>
        <TouchableOpacity onPress={handleDownvote} hitSlop={{ top: 5, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-down-outline" size={24} color={voteStatus === 'down' ? '#FF3B30' : '#888'} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {post.category ? (
          <Text style={[styles.category, { color: getCategoryColor(post.category) }]}>
            {post.category.toUpperCase()}
          </Text>
        ) : null}
        <Text style={styles.meta}>{post.author} • {post.time}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
        <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>{post.body}</Text>
        <View style={styles.footer}>
          <Ionicons name="chatbubble-outline" size={18} color="#888" />
          <Text style={styles.footerText}>{post.comments.length} Comments</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', marginBottom: 8, paddingVertical: 12, paddingHorizontal: 8 },
  voteSidebar: { alignItems: 'center', width: 40, marginRight: 8 },
  voteCount: { fontSize: 12, fontWeight: 'bold', marginVertical: 4 },
  content: { flex: 1 },
  category: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
  meta: { fontSize: 12, color: '#666', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  body: { fontSize: 14, marginBottom: 8 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#888', marginLeft: 4 },
});
