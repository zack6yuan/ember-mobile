import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Ember, EmberGradientBar, Radius } from '@/constants/theme';
import { useUser } from '@/store/UserContext';
import type { IdentityMode } from '@/store/PostsContext';

function IdentityCard({
  emoji,
  title,
  subtitle,
  selected,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, selected ? styles.cardSelected : styles.cardIdle]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={[styles.cardTitle, { color: selected ? Ember.textPrimary : '#e9d9cd' }]}>{title}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setDefaultMode, session } = useUser();
  const [mode, setMode] = useState<IdentityMode>('anonymous');

  const onContinue = async () => {
    await setDefaultMode(mode);
    router.replace('/(tabs)/feed');
  };

  return (
    <LinearGradient colors={['rgba(240,120,40,0.16)', 'transparent']} locations={[0, 0.4]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <LinearGradient colors={EmberGradientBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.body}>
        <Text serif style={styles.h1}>
          How do you want to show up?
        </Text>
        <Text style={styles.subtitle}>You can change this on any post, any time.</Text>

        <View style={styles.cards}>
          <IdentityCard
            emoji="🌙"
            title="Stay anonymous"
            subtitle="No name, no face. Just your words."
            selected={mode === 'anonymous'}
            onPress={() => setMode('anonymous')}
          />
          <IdentityCard
            emoji="✨"
            title="Pick a username"
            subtitle={`Let people recognise you across posts${session.handle ? ` — you're @${session.handle}` : ''}.`}
            selected={mode === 'named'}
            onPress={() => setMode('named')}
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton label="Continue" onPress={onContinue} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 4 },
  progressTrack: { flex: 1, height: 4, borderRadius: 4, backgroundColor: Ember.surface3, overflow: 'hidden' },
  progressFill: { width: '66%', height: '100%' },
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 22 },
  h1: { fontSize: 28, lineHeight: 34, color: Ember.textPrimary, marginBottom: 10 },
  subtitle: { color: '#b9a89e', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  cards: { gap: 12 },
  card: { borderRadius: Radius.card, padding: 16 },
  cardSelected: { backgroundColor: '#1e130c', borderWidth: 1.5, borderColor: Ember.ember },
  cardIdle: { backgroundColor: Ember.surface, borderWidth: 1, borderColor: Ember.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardEmoji: { fontSize: 20 },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardSubtitle: { color: '#a8988e', fontSize: 13, lineHeight: 20 },
  footer: { paddingHorizontal: 26 },
});
