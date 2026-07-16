import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Ember, Radius } from '@/constants/theme';
import { displayName } from '@/lib/identity';
import { usePosts, type Reply } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';

function ReplyRow({ reply }: { reply: Reply }) {
  const named = reply.author.mode === 'named';
  return (
    <View style={styles.reply}>
      <View style={styles.replyHead}>
        <Text style={[styles.replyName, { color: named ? Ember.ember : Ember.textSecondary }]}>
          {displayName(reply.author)}
        </Text>
        <Text style={styles.replyTime}>· {reply.createdAt}</Text>
      </View>
      <Text style={styles.replyBody}>{reply.body}</Text>
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getPost, toggleHug, toggleHeart, addReply, deletePost } = usePosts();
  const { defaultIdentity } = useUser();
  const [text, setText] = useState('');

  const post = getPost(id);
  if (!post) return null;

  const send = () => {
    if (!text.trim()) return;
    addReply(post.id, text.trim(), defaultIdentity);
    setText('');
  };

  const confirmDelete = () => {
    Alert.alert('Delete post?', 'This removes it for everyone. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  const header = (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.tag}>#{post.tag}</Text>
        <View style={styles.topBarSpacer} />
        {post.mine && (
          <TouchableOpacity onPress={confirmDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={20} color={Ember.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.authorRow}>
        <Avatar identity={post.author} size={28} />
        <Text style={styles.authorName}>{displayName(post.author)}</Text>
        <Text style={styles.authorTime}>· {post.createdAt}</Text>
      </View>

      <Text serif style={styles.body}>
        {post.body}
      </Text>

      <View style={styles.reactions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.reactionBtn, post.myHug && styles.reactionActive]}
          onPress={() => toggleHug(post.id)}
        >
          <Text style={styles.reactionText}>🫂 {post.myHug ? 'Held' : 'I hear you'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.reactionBtn, post.myHeart && styles.reactionActive]}
          onPress={() => toggleHeart(post.id)}
        >
          <Text style={styles.reactionText}>❤️ {post.hearts}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={post.replies}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 4 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ReplyRow reply={item} />}
        ListEmptyComponent={<Text style={styles.noReplies}>No replies yet. Be the first to sit with them.</Text>}
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputPill}>
          <TextInput
            style={styles.input}
            placeholder="Say something kind…"
            placeholderTextColor={Ember.textMutedDeep}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={send} hitSlop={8}>
            <Text style={styles.send}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  list: { paddingHorizontal: 18, paddingBottom: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
  topBarSpacer: { flex: 1 },
  tag: { color: Ember.ember, fontSize: 13, fontWeight: '700' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  authorName: { color: '#e9d9cd', fontSize: 13, fontWeight: '600' },
  authorTime: { color: Ember.textMutedDeep, fontSize: 12 },
  body: { color: '#f3e7dd', fontSize: 19, lineHeight: 28, marginBottom: 18 },
  reactions: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  reactionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Ember.surface3,
    borderRadius: Radius.segment,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionActive: { borderColor: Ember.ember, backgroundColor: '#2a1c13' },
  reactionText: { color: Ember.reactionWarm, fontWeight: '600', fontSize: 13 },
  divider: { height: 1, backgroundColor: Ember.borderStrong, marginBottom: 14 },
  reply: { marginBottom: 16 },
  replyHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  replyName: { fontSize: 12, fontWeight: '600' },
  replyTime: { color: Ember.textMutedDeep, fontSize: 11 },
  replyBody: { color: '#c9b9ae', fontSize: 13, lineHeight: 20 },
  noReplies: { color: Ember.textMutedDeep, fontSize: 13, lineHeight: 20, paddingVertical: 6 },
  composer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Ember.border,
    backgroundColor: Ember.bg,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 14,
    height: 44,
  },
  input: { flex: 1, color: Ember.textPrimary, fontSize: 13, fontFamily: 'HankenGrotesk_400Regular' },
  send: { color: Ember.ember, fontSize: 16 },
});
