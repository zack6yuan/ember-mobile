# Google sign-in — activation guide (issue #1)

The app-side code for "Continue with Google" is already written and wired, but
kept **dormant** behind a single flag so the current Expo Go / web dev loop keeps
working. Native Google sign-in cannot run in Expo Go — it needs a **custom dev
build**. This guide covers flipping it on once you graduate to that build.

## What's already in place

| File | Role |
| --- | --- |
| `lib/googleSignIn.ts` | Feature flag, client-ID constants, native token fetch (`getGoogleIdToken`), native sign-out, cancellation helper |
| `store/AuthContext.tsx` | `signInWithGoogle()` — exchanges the Google ID token via `GoogleAuthProvider.credential` + `signInWithCredential`; returns `{ user, isNewUser }` |
| `components/GoogleButton.tsx` | Ember-styled "Continue with Google" button |
| `app/login.tsx`, `app/signup.tsx` | Render the button (gated on `isGoogleSignInAvailable()`) and provision a profile for first-time users |
| `lib/handle.ts` | `suggestHandle()` — derives a valid `@handle` for new Google users |

Everything reads `isGoogleSignInAvailable()` (flag **off** + hidden on web), so
until you complete the steps below, nothing renders and nothing changes.

## Prerequisite: custom dev build

Google's native module ships as `host.exp.Exponent`-incompatible native code, so
move off Expo Go once:

```bash
npx expo run:ios      # or: npx expo run:android  (or an EAS dev build)
```

After this one-time step, `npx expo start` works the same — it just targets your
dev client instead of Expo Go.

## Step 1 — install the native module

```bash
npx expo install @react-native-google-signin/google-signin
```

## Step 2 — Google Cloud / Firebase OAuth client IDs

Firebase project `scrubs-daff9` already has the Google provider enabled. In the
underlying Google Cloud project, create OAuth client IDs:

- **Web** client ID — Firebase uses it to verify the returned ID token
- **iOS** client ID — tied to the iOS bundle identifier
- **Android** client ID — tied to the Android package name + SHA-1 fingerprint

## Step 3 — app config

Add the config plugin and the iOS URL scheme to `app.json` under `expo.plugins`
(the reversed iOS client ID is `com.googleusercontent.apps.<IOS_CLIENT_ID>`):

```jsonc
"plugins": [
  "expo-router",
  // ...existing plugins...
  [
    "@react-native-google-signin/google-signin",
    { "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID" }
  ]
]
```

> Note: don't add this plugin entry until the package is installed (step 1) —
> Expo fails to resolve a plugin for an absent package, which is exactly why it
> isn't committed to `app.json` yet.

## Step 4 — fill in the client IDs

In `lib/googleSignIn.ts`, replace the placeholders:

```ts
export const GOOGLE_WEB_CLIENT_ID = '...apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '...apps.googleusercontent.com';
```

## Step 5 — flip the flag

```ts
// lib/googleSignIn.ts
export const GOOGLE_SIGNIN_ENABLED = true;
```

Rebuild the dev client (`npx expo run:ios` / `run:android`). The button now
appears on the login and signup screens.

## Flow recap

1. Button → `getGoogleIdToken()` presents the native Google sheet, returns an ID token.
2. `signInWithGoogle()` exchanges it for a Firebase session and reports `isNewUser`.
3. New users → `createProfile(uid, handle)` (handle derived from their Google name), then the root navigator routes them to onboarding.
4. Returning users → straight to the feed. Existing email/password auth is untouched — this is purely additive.

## Web note

The native module doesn't run on web, so the button is hidden there
(`isGoogleSignInAvailable()` returns false on web). If web Google sign-in is
wanted later, add a Firebase `signInWithPopup(GoogleAuthProvider)` branch.
