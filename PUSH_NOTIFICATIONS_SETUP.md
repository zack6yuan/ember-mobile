# Push notifications — activation guide (issue #10)

The app-side code for push notifications on hugs / hearts / replies is already
written and wired, but kept **dormant** behind a single flag so the current Expo
Go / web dev loop keeps working. Remote push cannot run in Expo Go — it needs a
**custom dev build** — and it bundles naturally with Google sign-in (issue #1),
which needs the same build. This guide covers flipping it on once you graduate to
that build.

## How it fits together

Ember already leaves an in-app "warmth" notification in
`users/{uid}/notifications` whenever someone reacts to or replies to your post
(see `lib/notifications.ts`). Push layers on top of that existing write:

1. Each device registers an **Expo push token**, saved on its own (owner-only)
   user profile doc.
2. A **Cloud Function** (`functions/`) triggers on every new notification doc,
   reads the recipient's token with the Admin SDK, and sends the push through
   Expo's push service. The token stays private — only the backend reads it, so
   no peer client ever sees another person's token.
3. Tapping the push deep-links to the post.

## What's already in place

| File | Role |
| --- | --- |
| `lib/pushNotifications.ts` | Feature flag, `isPushNotificationsAvailable()`, permission + token registration, foreground handler, tap listeners |
| `lib/expoNotificationsStub.js` | Metro stub so Expo Go / web bundles build while `expo-notifications` isn't installed |
| `metro.config.js` | Resolves `expo-notifications` to the stub while uninstalled |
| `store/UserContext.tsx` | `registerPushToken()` — saves the device token on `users/{uid}` |
| `store/AuthContext.tsx` | Clears the token on sign-out (so a signed-out device stops receiving warmth) |
| `app/_layout.tsx` | Configures the handler, registers the token when signed in, routes taps to `/post/[id]` |
| `functions/` | Cloud Function sender + `firebase.json` `functions` entry |

Everything reads `isPushNotificationsAvailable()` (flag **off** + hidden on web),
so until you complete the steps below, nothing runs and nothing changes.

## Prerequisite: custom dev build

`expo-notifications` remote push needs native code, so move off Expo Go once:

```bash
npx expo run:ios      # or: npx expo run:android  (or an EAS dev build)
```

After this one-time step, `npx expo start` works the same — it just targets your
dev client instead of Expo Go.

## Step 1 — install the module

```bash
npx expo install expo-notifications
```

Once installed, Metro resolves `expo-notifications` to the real module instead of
the stub automatically — no code change needed.

## Step 2 — app config

Add the plugin and an EAS `projectId` to `app.json` under `expo`:

```jsonc
{
  "expo": {
    // ...
    "plugins": [
      "expo-router",
      // ...existing plugins...
      "expo-notifications"
    ],
    "extra": {
      "eas": { "projectId": "YOUR_EAS_PROJECT_ID" }
    }
  }
}
```

`getExpoPushTokenAsync` needs the `projectId` to mint a token; `lib/pushNotifications.ts`
reads it from `Constants.expoConfig.extra.eas.projectId`. Get one with
`eas init` (or copy it from the Expo dashboard).

> Note: don't add the plugin entry until the package is installed (step 1) —
> Expo fails to resolve a plugin for an absent package, which is why it isn't
> committed to `app.json` yet.

### iOS push credentials

Remote push on iOS needs an APNs key registered with your Expo/EAS project
(`eas credentials`). Android works out of the box through Expo's FCM handling for
Expo push tokens.

## Step 3 — deploy the sender

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This deploys `sendWarmthPush`, which fires on every `users/{uid}/notifications`
write and pushes to the recipient's registered device.

## Step 4 — flip the flag

```ts
// lib/pushNotifications.ts
export const PUSH_NOTIFICATIONS_ENABLED = true;
```

Rebuild the dev client (`npx expo run:ios` / `run:android`). On next sign-in the
app requests notification permission and registers the device token; hugs and
replies now arrive as pushes.

## Flow recap

1. Signed-in device → `registerForPushNotificationsAsync()` asks permission and
   returns an Expo push token → `registerPushToken()` saves it on the user doc.
2. Someone reacts / replies → the app writes to `users/{uid}/notifications`
   (unchanged existing behavior).
3. `sendWarmthPush` reads the recipient's token and sends the push via Expo.
4. Tapping the push → `app/_layout.tsx` routes to `/post/[id]`.
5. Sign-out clears the device token; the function prunes tokens Expo reports as
   `DeviceNotRegistered`.

## Notes & future work

- **One device per account.** The token is a single field on the user doc, so the
  most recently registered device wins. To support multiple devices, move tokens
  to a `users/{uid}/pushTokens/{token}` subcollection and fan the send out over
  all of them.
- **Web.** `expo-notifications` push doesn't run on web, so registration is
  skipped there (`isPushNotificationsAvailable()` returns false).
- **No rules change needed.** The token lives on the existing owner-only
  `users/{uid}` doc; the Cloud Function reads it with the Admin SDK, which
  bypasses Firestore rules.
