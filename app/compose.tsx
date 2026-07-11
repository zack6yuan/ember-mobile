import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { TagChip } from '@/components/TagChip';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, TAG_ORDER, type TagId, type IdentityMode } from '@/store/PostsContext';
import { useUser } from '@/store/UserContext';

export default function ComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addPost, activeTag, setActiveTag } = usePosts();
  const { session, anonIdentity, namedIdentity } = useUser();

  const [body, setBody] = useState('');
  const [tag, setTag] = useState<TagId>(activeTag);
  const [mode, setMode] = useState<IdentityMode>(session.defaultMode);

  const canPost = body.trim().length > 0;

  const submit = () => {
    if (!canPost) return;
    const identity = mode === 'named' ? namedIdentity : anonIdentity;
    addPost({ body: body.trim(), tag, identity });
    setActiveTag(tag);
    router.replace('/posted');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>New post</Text>
        <TouchableOpacity onPress={submit} disabled={!canPost} hitSlop={8}>
          <Text style={[styles.post, { color: canPost ? Ember.ember : Ember.disabled }]}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text serif style={styles.prompt}>
          What&apos;s on your heart?
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Let it out. No judgment here."
          placeholderTextColor="#6f625a"
          value={body}
          onChangeText={setBody}
          multiline
          autoFocus
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.label}>Post to</Text>
        <View style={styles.tagRow}>
          {TAG_ORDER.map((t) => (
            <TagChip key={t} label={`#${t}`} active={tag === t} onPress={() => setTag(t)} small />
          ))}
        </View>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, mode === 'anonymous' && styles.segmentActive]}
            onPress={() => setMode('anonymous')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, mode === 'anonymous' ? styles.segmentTextActive : styles.segmentTextIdle]}>
              🌙 Anonymous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, mode === 'named' && styles.segmentActive]}
            onPress={() => setMode('named')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, mode === 'named' ? styles.segmentTextActive : styles.segmentTextIdle]}>
              Post as @{session.handle}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  cancel: { color: Ember.textSecondary, fontSize: 15 },
  topTitle: { color: Ember.textMutedDeep, fontSize: 13, fontWeight: '600' },
  post: { fontSize: 15, fontWeight: '700' },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 14 },
  prompt: { fontSize: 24, color: Ember.textPrimary, marginBottom: 14 },
  input: {
    flex: 1,
    color: Ember.textPrimary,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'HankenGrotesk_400Regular',
    minHeight: 160,
  },
  footer: { paddingHorizontal: 20, gap: 14 },
  label: {
    color: Ember.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  segment: {
    flexDirection: 'row',
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.button,
    padding: 5,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: Radius.segment },
  segmentActive: { backgroundColor: Ember.surfaceSelected },
  segmentText: { fontSize: 13 },
  segmentTextActive: { color: Ember.textPrimary, fontWeight: '700' },
  segmentTextIdle: { color: Ember.textMuted, fontWeight: '600' },
});
