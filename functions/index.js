/**
 * Push notification sender for Ember (issue #10).
 *
 * The app already writes a "warmth" doc to `users/{uid}/notifications` whenever
 * someone hugs/hearts/etc. or replies to a post (see lib/notifications.ts). That
 * subcollection is the trigger point here: on each new notification we look up
 * the recipient's stored Expo push token and send them a push via Expo's push
 * service. The token lives on the (owner-only) user doc, so only this trusted
 * backend — running with the Admin SDK, which bypasses Firestore rules — can
 * read it; a peer client never sees another person's token.
 *
 * This is DORMANT until deployed (`firebase deploy --only functions`) and only
 * delivers to devices that have registered a token, which itself requires the
 * app's PUSH_NOTIFICATIONS_ENABLED flag and a custom dev build. See
 * PUSH_NOTIFICATIONS_SETUP.md.
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// How each reaction reads in a push: "Someone <phrase>". Kept in step with
// lib/reactions.ts (notifPhrase) — reactions stay anonymous, like in-app.
const REACTION_PHRASE = {
  hug: 'sent a hug on your post',
  heart: 'hearted your post',
  candle: 'is holding space for you',
  metoo: 'said “me too”',
  strength: 'sent you strength',
};

/** Build the push title + body from a stored notification, in Ember's voice. */
function composeMessage(notif) {
  const named =
    notif.actor && notif.actor.mode === 'named' && notif.actor.handle
      ? `@${notif.actor.handle}`
      : null;
  if (notif.type === 'reply') {
    return {
      title: named ? `${named} replied` : 'New reply',
      body: notif.replyBody || 'Someone replied to your post.',
    };
  }
  const phrase = REACTION_PHRASE[notif.type] || 'reacted to your post';
  return { title: 'Warmth for you', body: `Someone ${phrase}` };
}

/** Send one message to the Expo push service and return the parsed tickets. */
async function sendToExpo(message) {
  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    throw new Error(`Expo push HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [json.data];
}

exports.sendWarmthPush = onDocumentCreated(
  'users/{uid}/notifications/{notifId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const notif = snap.data();
    const uid = event.params.uid;

    // Look up the recipient's registered device token.
    const userSnap = await db.doc(`users/${uid}`).get();
    const token = userSnap.get('pushToken');
    if (!token || typeof token !== 'string') {
      // No device registered (or signed out) — the in-app notification still stands.
      return;
    }

    const { title, body } = composeMessage(notif);
    const message = {
      to: token,
      title,
      body,
      sound: 'default',
      channelId: 'warmth',
      // Consumed by the app's tap handler to deep-link to the post.
      data: { postId: notif.postId, type: notif.type },
    };

    let tickets;
    try {
      tickets = await sendToExpo(message);
    } catch (err) {
      console.error('Failed to send push:', err);
      return;
    }

    // If Expo says the device is no longer registered (app uninstalled or push
    // disabled), prune the stale token so we stop trying to reach it.
    const ticket = tickets && tickets[0];
    if (
      ticket &&
      ticket.status === 'error' &&
      ticket.details &&
      ticket.details.error === 'DeviceNotRegistered'
    ) {
      await db.doc(`users/${uid}`).set({ pushToken: '' }, { merge: true });
    }
  }
);
