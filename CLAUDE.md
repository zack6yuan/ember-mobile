# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ember is a warm, literary mental-health social app for people to share raw feelings anonymously or under a handle. Expo + React Native, Firebase (Auth + Firestore) backend. The whole tone — copy, colors, animations — leans gentle and "hearth-like"; keep that voice when adding UI.

## Commands

```bash
npx expo start          # start Metro (dev). Then open in Expo Go / a sim.
npm run lint            # expo lint (eslint-config-expo)
npx tsc --noEmit        # typecheck (strict mode is on)
```

There is no test suite. Verify changes by running the app (see below), not by adding tests unless asked.

### Running on the iOS simulator (for live verification)

Do **not** use `expo start --ios` — it hangs in a non-interactive shell on the "Install the recommended Expo Go version?" prompt. Instead:

1. Boot a device first: `xcrun simctl boot "iPhone 16 Pro"` (or a udid), and `open -a Simulator`.
2. `npx expo start` in the background (no `--ios`) — Metro serves on `http://localhost:8081`.
3. Load/reload the app in the pre-installed Expo Go: `xcrun simctl openurl booted "exp://127.0.0.1:8081"`.
4. Clean cold reload (resets state): `xcrun simctl terminate booted host.exp.Exponent` then re-run the openurl.

There is no native `ios/`/`android/` folder — the app only runs through Expo Go unless you `expo prebuild` first. On the sim, taps land reliably but swipe/scroll gestures often don't register; prefer tap-based navigation and force transient UI states (skeletons, spinners) in code rather than racing a screenshot.

### Deploying Firestore security rules

Edit `firestore.rules` (the source of truth) and deploy via the **CLI**, never by pasting into the Firebase console editor (pasting has silently corrupted the text, and a non-compiling console publish keeps the OLD rules while looking successful). Firebase CLI is not installed globally:

```bash
npx -y firebase-tools login                       # needs a real browser — user runs this
npx -y firebase-tools deploy --only firestore:rules
```

`firebase.json` + `.firebaserc` pin project `scrubs-daff9`.

## Architecture

### Navigation & auth gating (Expo Router, file-based)

`app/` is the route tree (typed routes enabled). `app/_layout.tsx` is the root: it loads fonts, wires the provider stack, and `RootNavigator` performs **redirect-based auth gating** off `AuthContext` + `UserContext` — logged-out → `index` (welcome); signed-in but `!session.onboarded` → `onboarding`; otherwise → `(tabs)/feed`. The splash screen is held until auth resolves *and* the profile load has settled (succeeded or failed) so a transient profile-load failure never strands the user. `(tabs)/` holds the five main tabs; several routes (`compose`, `breathe`, `edit-profile`, `posted`) are presented as modals.

### State: three nested React contexts (`store/`)

Provider order is **AuthProvider → UserProvider → PostsProvider** (each depends on the ones above via `useAuth`/`useUser`):

- **`AuthContext`** — Firebase Auth session (email/password). `authErrorMessage()` maps Firebase error codes to Ember's gentle copy. Note: email-enumeration protection is ON, so `resetPassword` resolves even for unknown addresses — the UI mirrors this with a neutral confirmation.
- **`UserContext`** — the person's Ember profile at `users/{uid}` (handle, avatar, default identity mode, joined communities, streak, mood/journal). Live-subscribed via `onSnapshot`.
- **`PostsContext`** — the feed. Live-subscribes to `posts`, and is the single choke point where **content gates and rate limits run** (`addPost`/`addReply` resolve `{ ok, message }` so composers can show the reason inline while keeping the typed text). Every post/reply carries an **identity** (`{ mode: 'anonymous' | 'named', handle? }`) — the same author can post anonymously or under their handle per-post. Firestore rejects `undefined`, so the handle is dropped (not set undefined) for anonymous identities.

### Firestore data model

Top-level collections: `posts`, `communities` (one doc per tag/circle, with join counts), `reports`, `users`. Under `users/{uid}`: `saved`, `blocked`, `hidden`, `following`, `moods` (doc id = local `YYYY-MM-DD`), `journal`, `notifications`.

Replies and reaction counts are **denormalized onto the post doc** — a post holds a `replies[]` array and per-reaction count fields plus `…By` uid arrays (see `lib/reactions.ts` for the `countField`/`byField` mapping). Reactions are toggled with `arrayUnion`/`arrayRemove` + `increment` so the count moves in lockstep with the caller's uid. Known limitation: Firestore rules can't iterate arrays, so a same-length rewrite of `replies[]` could still edit an existing reply's text — the tracked fix is moving replies to a subcollection.

### Security model (`firestore.rules` is the real enforcement)

Client-side gates are UX guardrails only; the rules are what actually enforce. They're written defensively: reaction writes may only add/remove the caller's own uid (and the count must move by exactly one), reply appends must carry exactly one reply authored by the caller (no truncating others'), `createdAt` is bounded to server time (no future-dating to pin to the top), post creates are shape/length-checked against a key whitelist, and community counts may only move by one per write. When you change what the app writes, update the rules in the same change or writes will be denied.

### Anti-abuse (two layers)

- `lib/limits.ts` — content gates (length bounds, empty/whitespace, repeated-character junk; case is folded first because iOS autocapitalizes).
- `lib/rateLimit.ts` — sliding-window limiter, per-action cooldown + rolling cap, mirrored to AsyncStorage so a limit survives a force-quit. Current rules: posts 30s / 15-per-hour, replies 5s / 60, reactions 0s / 120-per-5min (stuck-tap guard), reports 10s / 20.

Both run inside `PostsContext`, not per-screen, so every caller is covered.

### Design system (`constants/theme.ts`, `components/Text.tsx`)

One dark "Hearth" theme (the app is dark-mode only, `userInterfaceStyle: "dark"`). Import color/spacing/radius tokens from `constants/theme.ts` (`Ember`, `EmberGradient`, `Radius`, `Fonts`) verbatim — they come from a design handoff. Use the app's **`components/Text.tsx`** primitive rather than RN `Text`: it maps `fontWeight` to the correct bundled font face (Hanken Grotesk for body/UI, Newsreader serif for headlines via the `serif`/`italic` props) since custom fonts carry their own weight geometry.

**Feed post body text stays uniform** — one face, one size (14px Hanken Grotesk in `PostCard.tsx`). "Pull-quote" styling (serif / larger size for short posts) was built, tried live, and rejected as looking inconsistent; don't rebuild it. Get feed variety from something other than type (accent rules, spacing, background tint — the reacted-state warm tint in `PostCard.tsx` is the precedent). The post *detail* screen using serif at 19/28 is fine because it's a single post on its own screen.

## Gotchas

- **Firestore must use long-polling.** `lib/firebase.ts` initializes with `initializeFirestore(app, { experimentalForceLongPolling: true })`, not `getFirestore(app)`. Without it the app runs cache-only in React Native — UI looks fully functional via latency compensation but nothing ever reaches the server. This is invisible to Node-based SDK tests (Node supports WebChannel); verify sync by reading the server from a separate connection, not just the app UI.
- **Firebase init is idempotent for Fast Refresh.** `getApps().length ? getApp() : initializeApp(...)`, and `initializeAuth`/`initializeFirestore` are wrapped in try/catch falling back to the getters, because re-evaluating the module on Fast Refresh would otherwise throw "duplicate-app".
- **Project id `scrubs-daff9` is a legacy name and is immutable** (leftover from a prior "scrubs" app; the product is Ember). It surfaces in auth email sender domains / reset links. To get "scrubs" out of auth *email wording*, set the public-facing name to "Ember" in Firebase Console → Project settings → General (console-only, no CLI).
- Path alias: `@/*` maps to the repo root (e.g. `@/store/AuthContext`).

## Working style

The user prefers replies in casual Gen Z / slang tone. Keep the style casual but the technical substance accurate and clear.
