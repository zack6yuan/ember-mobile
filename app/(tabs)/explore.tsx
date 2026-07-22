import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { AuthorRow } from '@/components/AuthorRow';
import { PostCard } from '@/components/PostCard';
import { Ember, Radius } from '@/constants/theme';
import { usePosts, type Post, type TagId } from '@/store/PostsContext';
import { MOODS } from '@/lib/moods';

const SUGGESTIONS = ["can't sleep", 'first job 🎉', 'breakups', 'quiet wins', 'homesick'];

const DAY_MS = 24 * 60 * 60 * 1000;

// Each check-in mood opens onto the circles that tend to hold that feeling.
const MOOD_TAGS: Record<string, TagId[]> = {
  struggling: ['venting', 'grief', 'heartbreak'],
  low: ['lonely', 'latenight', 'healing'],
  okay: ['advice', 'work'],
  good: ['gratitude', 'hope'],
  bright: ['wins', 'gratitude', 'hope'],
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts } = usePosts();
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<string | null>(null);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? posts.filter((p) => p.body.toLowerCase().includes(trimmed) || p.tag.includes(trimmed))
    : [];

  const openPost = (id: string) => router.push({ pathname: '/post/[id]', params: { id } });

  // "Warm right now": the most-hugged posts from the last 24h. Falls back to the
  // most-hugged overall on a quiet day so the rail is never empty.
  const warmNow = useMemo(() => {
    const now = Date.now();
    const byHugs = (a: Post, b: Post) => b.reactions.hug - a.reactions.hug;
    const today = posts.filter((p) => now - p.createdAtMs < DAY_MS).sort(byHugs);
    const source = today.length >= 3 ? today : [...posts].sort(byHugs);
    return source.filter((p) => p.reactions.hug > 0).slice(0, 6);
  }, [posts]);

  // Featured voices rotate by the day so Explore feels alive, not static.
  const featured = useMemo(() => {
    const named = posts.filter((p) => p.author.mode === 'named' && p.author.handle);
    if (!named.length) return [];
    const day = Math.floor(Date.now() / DAY_MS);
    const start = day % named.length;
    const take = Math.min(2, named.length);
    return Array.from({ length: take }, (_, i) => named[(start + i) % named.length]);
  }, [posts]);

  // Posts for the selected browse-by-mood entry point, newest first.
  const moodPosts = useMemo(() => {
    if (!mood) return [];
    const tags = MOOD_TAGS[mood] ?? [];
    return posts.filter((p) => tags.includes(p.tag)).sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [mood, posts]);
  const moodDef = MOODS.find((m) => m.id === mood);

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
            onChangeText={(t) => {
              setQuery(t);
              if (t.trim()) setMood(null);
            }}
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
        ) : mood ? (
          <>
            <TouchableOpacity style={styles.backChip} activeOpacity={0.8} onPress={() => setMood(null)}>
              <Text style={styles.backChipText}>← Explore</Text>
            </TouchableOpacity>
            <Text style={styles.label}>
              {moodDef?.emoji} Feeling {moodDef?.label.toLowerCase()} · {moodPosts.length}{' '}
              {moodPosts.length === 1 ? 'voice' : 'voices'}
            </Text>
            {moodPosts.length ? (
              <View style={{ gap: 12 }}>
                {moodPosts.map((p) => (
                  <PostCard key={p.id} id={p.id} />
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No voices here right now — check back soon.</Text>
            )}
          </>
        ) : (
          <>
            {/* Warm right now — most-hugged today */}
            <Text style={styles.label}>🔥 Warm right now</Text>
            {warmNow.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
                style={styles.railWrap}
              >
                {warmNow.map((p) => (
                  <TouchableOpacity key={p.id} activeOpacity={0.85} style={styles.warmCard} onPress={() => openPost(p.id)}>
                    <View style={styles.warmTop}>
                      <Text style={styles.warmTag}>#{p.tag}</Text>
                      <View style={styles.hugBadge}>
                        <Text style={styles.hugBadgeText}>🫂 {p.reactions.hug}</Text>
                      </View>
                    </View>
                    <Text serif style={styles.warmBody} numberOfLines={4}>
                      {p.body}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.empty}>It’s quiet right now. Be the warmth. 🔥</Text>
            )}

            {/* Suggestions */}
            <Text style={[styles.label, { marginTop: 22 }]}>Try searching</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestion} activeOpacity={0.8} onPress={() => setQuery(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Browse by mood */}
            <Text style={[styles.label, { marginTop: 22 }]}>Browse by mood</Text>
            <View style={styles.moods}>
              {MOODS.map((m) => (
                <TouchableOpacity key={m.id} style={styles.moodChip} activeOpacity={0.8} onPress={() => setMood(m.id)}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rotating featured voices */}
            {featured.length ? (
              <>
                <Text style={[styles.label, { marginTop: 22 }]}>Voices worth hearing</Text>
                <View style={{ gap: 12 }}>
                  {featured.map((p) => (
                    <TouchableOpacity key={p.id} activeOpacity={0.85} style={styles.featured} onPress={() => openPost(p.id)}>
                      <AuthorRow identity={p.author} time={`#${p.tag}`} avatarSize={22} />
                      <Text serif style={styles.featuredBody}>
                        “{p.body}”
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
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
  // Warm-right-now rail
  railWrap: { marginHorizontal: -20 },
  rail: { paddingHorizontal: 20, gap: 12 },
  warmCard: {
    width: 210,
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: 'rgba(240,130,74,0.18)',
    borderRadius: Radius.card,
    padding: 15,
    gap: 10,
  },
  warmTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  warmTag: { color: Ember.ember, fontSize: 12, fontWeight: '700' },
  hugBadge: {
    backgroundColor: Ember.surface3,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  hugBadgeText: { color: Ember.reactionWarm, fontSize: 12, fontWeight: '600' },
  warmBody: { color: Ember.textBody, fontSize: 16, lineHeight: 23 },
  // Suggestions
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestion: {
    backgroundColor: Ember.surface3,
    borderRadius: Radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  suggestionText: { color: Ember.reactionWarm, fontWeight: '600', fontSize: 13 },
  // Browse by mood
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Ember.surface3,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.chip,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { color: Ember.textSecondary, fontSize: 13, fontWeight: '600' },
  // Featured
  featured: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.card,
    padding: 16,
  },
  featuredBody: { color: Ember.textBody, fontSize: 16, lineHeight: 24, marginTop: 9 },
  // Back
  backChip: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 6 },
  backChipText: { color: Ember.ember, fontSize: 14, fontWeight: '600' },
  empty: { color: Ember.textMuted, fontSize: 14, lineHeight: 22 },
});
