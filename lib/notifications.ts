import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ReactionId } from '@/lib/reactions';
import type { Identity, TagId } from '@/store/PostsContext';

export type NotificationType = ReactionId | 'reply';

/** Firestore document shape for a notification (stored under the recipient). */
export type StoredNotification = {
  type: NotificationType;
  actorUid: string; // who triggered it — Firestore rules verify this === auth.uid
  actor: Identity; // display identity (anonymous for reactions, may be named for replies)
  postId: string;
  postBody: string; // snapshot of the post for context (truncated)
  tag: TagId;
  replyBody?: string; // the reply text (reply type only)
  createdAt: number; // epoch ms
  read: boolean;
};

export type AppNotification = StoredNotification & { id: string };

const SNIPPET = 90;
const snippet = (s: string) => (s.length > SNIPPET ? `${s.slice(0, SNIPPET).trimEnd()}…` : s);

type NotifyInput = {
  recipientUid: string | null;
  actorUid: string;
  type: NotificationType;
  actor: Identity;
  postId: string;
  postBody: string;
  tag: TagId;
  replyBody?: string;
};

/**
 * Leave a notification in the recipient's private subcollection. No-ops when the
 * post has no owner or the actor is the recipient (you don't get warmth from
 * yourself). Fire-and-forget: a failed notification never blocks the hug/heart/
 * reply that triggered it.
 */
export function notify({ recipientUid, actorUid, type, actor, postId, postBody, tag, replyBody }: NotifyInput) {
  if (!recipientUid || recipientUid === actorUid) return;
  const notif: StoredNotification = {
    type,
    actorUid,
    actor,
    postId,
    postBody: snippet(postBody),
    tag,
    createdAt: Date.now(),
    read: false,
    // Firestore rejects `undefined`; only include a body for replies.
    ...(replyBody ? { replyBody: snippet(replyBody) } : {}),
  };
  addDoc(collection(db, 'users', recipientUid, 'notifications'), notif).catch((e) =>
    console.warn('Failed to write notification:', e)
  );
}
