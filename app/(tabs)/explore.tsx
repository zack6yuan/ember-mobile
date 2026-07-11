import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { AuthorRow } from '@/components/AuthorRow';
import { PostCard } from '@/components/PostCard';
import { Ember, Radius } from '@/constants/theme';
import { usePosts } from '@/store/PostsContext';

const SUGGESTIONS = ["can't sleep", 'first job 🎉', 'breakups', 'quiet wins', 'homesick'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts } = usePosts();
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? posts.filter((p) => p.body.toLowerCase().includes(trimmed) || p.tag.includes(trimmed))
    : [];

  // Featured: a warm, gratitude-flavoured voice.
  const featured = posts.find((p) => p.tag === 'gratitude') ?? posts[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search feelings, words, tags…"
            placeholderTextColor={Ember.textMutedDeep}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {trimmed ? (
          <>
            <Text style={styles.label}>
              {results.length} {results.length === 1 ? 'voice' : 'voices'} for “{query.trim()}”
            </Text>
            {results.length ? (
              <View style={{ gap: 12 }}>
                {results.map((p) => (
                  <PostCard key={p.id} id={p.id} />
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>Nothing yet — try a feeling, a word, or a #tag.</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>Warm right now</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestion} activeOpacity={0.8} onPress={() => setQuery(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 22 }]}>A voice worth hearing</Text>
            {featured ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.featured}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: featured.id } })}
              >
                <AuthorRow identity={featured.author} time={`#${featured.tag}`} avatarSize={22} />
                <Text serif style={styles.featuredBody}>
                  “{featured.body}”
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  searchWrap: { paddingHorizontal: 18, paddingTop: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: Ember.textPrimary, fontSize: 14, fontFamily: 'HankenGrotesk_400Regular' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 170 },
  label: {
    color: Ember.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestion: {
    backgroundColor: Ember.surface3,
    borderRadius: Radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  suggestionText: { color: Ember.reactionWarm, fontWeight: '600', fontSize: 13 },
  featured: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.card,
    padding: 16,
  },
  featuredBody: { color: Ember.textBody, fontSize: 16, lineHeight: 24, marginTop: 9 },
  empty: { color: Ember.textMuted, fontSize: 14, lineHeight: 22 },
});
