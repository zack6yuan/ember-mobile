import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Text } from '@/components/Text';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/store/PostsContext';

export default function PostDetailScreen() {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { posts, addComment, setVote } = usePosts();
  
  const postId = params.id as string;
  const post = posts.find(p => p.id === postId);
  
  const [newComment, setNewComment] = useState('');

  if (!post) return null;

  const voteStatus = post.voteStatus || 'none';

  const handleUpvote = () => {
    setVote(post.id, voteStatus === 'up' ? 'none' : 'up');
  };

  const handleDownvote = () => {
    setVote(post.id, voteStatus === 'down' ? 'none' : 'down');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(postId, newComment.trim());
    setNewComment('');
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

  const renderHeader = () => (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
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
        <Text style={[styles.body, { color: colors.text }]}>{post.body}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'Post Details', headerBackTitle: 'Back' }} />
      
      <FlatList
        data={post.comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={[styles.commentContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.commentAvatar}>
              <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
            </View>
            <View style={styles.commentContent}>
              <Text style={styles.commentMeta}>{item.author} • {item.time}</Text>
              <Text style={[styles.commentText, { color: colors.text }]}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder="Add a comment..."
          placeholderTextColor="#888"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  postContainer: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8, marginBottom: 8 },
  voteSidebar: { alignItems: 'center', width: 40, marginRight: 8 },
  voteCount: { fontSize: 12, fontWeight: 'bold', marginVertical: 4 },
  content: { flex: 1 },
  category: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
  meta: { fontSize: 12, color: '#666', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  body: { fontSize: 16, marginBottom: 8, lineHeight: 22 },
  commentContainer: { flexDirection: 'row', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  commentContent: { flex: 1 },
  commentMeta: { fontSize: 12, color: '#666', marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, paddingBottom: 24, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, minHeight: 40, maxHeight: 100 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
});
