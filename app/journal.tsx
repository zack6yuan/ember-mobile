import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, Radius } from '@/constants/theme';
import { db } from '@/lib/firebase';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/store/AuthContext';

type Entry = { id: string; body: string; createdAt: number };

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = user?.uid;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'journal'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Entry, 'id'>) }))),
      (error) => console.warn('Journal listener error:', error)
    );
    return unsubscribe;
  }, [uid]);

  const save = () => {
    const body = text.trim();
    if (!body || !uid) return;
    addDoc(collection(db, 'users', uid, 'journal'), { body, createdAt: Date.now() }).catch((e) =>
      console.warn('Failed to save journal entry:', e)
    );
    setText('');
  };

  const remove = (id: string) => {
    if (!uid) return;
    Alert.alert('Delete this entry?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteDoc(doc(db, 'users', uid, 'journal', id)).catch((e) => console.warn('Failed to delete entry:', e)),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text serif style={styles.title}>
            Journal
          </Text>
          <Text style={styles.subtitle}>Private — only you can see this</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🕯️</Text>
            <Text style={styles.emptyBody}>
              A quiet place for the things you don’t want to post. Write the first one below.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onLongPress={() => remove(item.id)} delayLongPress={300} style={styles.entry}>
            <Text style={styles.entryBody}>{item.body}</Text>
            <Text style={styles.entryTime}>{timeAgo(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputPill}>
          <TextInput
            style={styles.input}
            placeholder="Write it down…"
            placeholderTextColor={Ember.textMutedDeep}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={save} hitSlop={8} disabled={!text.trim()}>
            <Text style={[styles.send, { color: text.trim() ? Ember.ember : Ember.disabled }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 10 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, color: Ember.textPrimary },
  subtitle: { color: Ember.textMutedDeep, fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  emptyList: { flexGrow: 1, paddingHorizontal: 18 },
  entry: {
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.cardSmall,
    padding: 14,
  },
  entryBody: { color: Ember.textBody, fontSize: 14, lineHeight: 21 },
  entryTime: { color: Ember.textMutedDeep, fontSize: 11, marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 12 },
  emptyEmoji: { fontSize: 34 },
  emptyBody: { color: Ember.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  composer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Ember.border,
    backgroundColor: Ember.bg,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 10,
    minHeight: 44,
    gap: 8,
  },
  input: { flex: 1, color: Ember.textPrimary, fontSize: 14, fontFamily: 'HankenGrotesk_400Regular', maxHeight: 120 },
  send: { fontSize: 16, paddingBottom: 2 },
});
