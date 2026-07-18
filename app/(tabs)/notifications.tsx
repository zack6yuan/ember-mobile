import { useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember } from '@/constants/theme';
import { db } from '@/lib/firebase';
import type { AppNotification, NotificationType } from '@/lib/notifications';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/store/AuthContext';

const EMOJI: Record<NotificationType, string> = {
  hug: '🫂',
  heart: '❤️',
  reply: '💬',
};

/** Build the warm one-liner for a notification, matching Ember's gentle voice. */
function describe(n: AppNotification): { pre?: string; lead: string; leadColor?: string; post?: string } {
  const named = n.actor.mode === 'named' && n.actor.handle ? `@${n.actor.handle}` : null;
  switch (n.type) {
    case 'hug':
      return { lead: 'Someone', post: ' sent a hug on your post' };
    case 'heart':
      return { lead: 'Someone', post: ' hearted your post' };
    case 'reply':
      return {
        lead: named ?? 'Someone',
        leadColor: named ? Ember.ember : undefined,
        post: ` replied: “${n.replyBody ?? ''}”`,
      };
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const [items, setItems] = useState<AppNotification[]>([]);
  const itemsRef = useRef<AppNotification[]>([]);
  itemsRef.current = items;

  // Live subscription to the current user's private notifications.
  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }))),
      (error) => console.warn('Notifications listener error:', error)
    );
    return unsubscribe;
  }, [uid]);

  // Clear the unread state whenever the tab is viewed.
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const unread = itemsRef.current.filter((n) => !n.read);
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true }));
      batch.commit().catch((e) => console.warn('Failed to mark notifications read:', e));
    }, [uid])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text serif style={styles.title}>
          Warmth for you
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🕯️</Text>
            <Text serif style={styles.emptyTitle}>
              No warmth yet
            </Text>
            <Text style={styles.emptyBody}>
              When someone sends a hug, a heart, or a reply to your posts, you’ll feel it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { pre, lead, leadColor, post } = describe(item);
          return (
            <Pressable
              onPress={() => router.push(`/post/${item.postId}`)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.emoji}>{EMOJI[item.type]}</Text>
              <View style={styles.content}>
                <Text style={styles.message}>
                  {pre}
                  <Text style={[styles.lead, { color: leadColor ?? Ember.textPrimary }]}>{lead}</Text>
                  {post}
                </Text>
                <Text style={styles.context}>
                  “{item.postBody}” · {timeAgo(item.createdAt)}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 26, color: Ember.textPrimary },
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 170 },
  emptyList: { flexGrow: 1, paddingHorizontal: 18 },
  divider: { height: 1, backgroundColor: Ember.border },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 8 },
  rowPressed: { opacity: 0.6 },
  emoji: { fontSize: 18 },
  content: { flex: 1 },
  message: { color: Ember.textBody, fontSize: 13, lineHeight: 20 },
  lead: { fontWeight: '700' },
  context: { color: Ember.textMutedDeep, fontSize: 12, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Ember.ember, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 10 },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { fontSize: 22, color: Ember.textPrimary },
  emptyBody: { color: Ember.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
