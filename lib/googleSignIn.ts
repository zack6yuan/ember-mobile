import { Platform } from 'react-native';

/**
 * Native Google sign-in wrapper (issue #1).
 *
 * This is written and wired end-to-end but kept DORMANT behind
 * {@link GOOGLE_SIGNIN_ENABLED}. The native module
 * (`@react-native-google-signin/google-signin`) only runs in a custom dev build
 * — not Expo Go and not web — so while the flag is off nothing here executes and
 * the app builds and runs exactly as before. The module is loaded via a runtime
 * (variable) require so Metro treats it as an optional dependency: the web /
 * Expo Go bundles keep building even though the package isn't installed yet.
 *
 * To turn it on, after graduating the dev loop to a custom dev build:
 *   1. npx expo install @react-native-google-signin/google-signin
 *   2. Add the config plugin + iOS URL scheme to app.json (see GOOGLE_SIGNIN_SETUP.md)
 *   3. Fill in the client IDs below
 *   4. Flip GOOGLE_SIGNIN_ENABLED to true and rebuild the dev client
 * Everything downstream (AuthContext.signInWithGoogle + the "Continue with
 * Google" buttons) reads {@link isGoogleSignInAvailable}, so that's the only
 * switch you need.
 */
export const GOOGLE_SIGNIN_ENABLED = false;

/**
 * OAuth client IDs from the Google Cloud project behind Firebase `scrubs-daff9`.
 * The Web client ID is what Firebase uses to verify the returned ID token; the
 * iOS client ID backs the reversed-client URL scheme. Fill these in when
 * enabling (they are not secrets, but keep them accurate).
 */
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

/**
 * Whether the native Google flow can actually run here. Gated on the flag and
 * the platform: the native module is unavailable on web (a web build would need
 * Firebase's popup flow instead), so the button stays hidden there.
 */
export function isGoogleSignInAvailable(): boolean {
  return GOOGLE_SIGNIN_ENABLED && Platform.OS !== 'web';
}

/** Thrown when the native flow is invoked while unavailable — a guard, not a UX path. */
export class GoogleSignInUnavailableError extends Error {
  constructor() {
    super('Google sign-in is not enabled in this build.');
    this.name = 'GoogleSignInUnavailableError';
  }
}

/** The slice of the native module we use, typed locally so we don't depend on it. */
type GoogleSigninModule = {
  GoogleSignin: {
    configure(opts: { webClientId: string; iosClientId?: string; offlineAccess?: boolean }): void;
    hasPlayServices(opts?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean>;
    signIn(): Promise<{ data?: { idToken?: string | null } | null; idToken?: string | null }>;
    signOut(): Promise<void>;
  };
};

let cached: GoogleSigninModule | null = null;
let configured = false;

/**
 * Load the native module lazily. The module id lives in a variable so Metro
 * cannot resolve it statically and won't pull the (uninstalled) package into the
 * web / Expo Go graph. Only ever reached inside a dev build where the flag is on
 * and the package therefore exists.
 */
function loadModule(): GoogleSigninModule {
  if (cached) return cached;
  // Static require of the real package. Metro resolves it to a local stub while
  // the package isn't installed (see metro.config.js), so the bundle builds; in a
  // dev build with the package present, this is the real native module. Only
  // reached when the flag is on, so the stub is never actually invoked.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cached = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  return cached;
}

/**
 * Present the native Google sheet and return a Firebase-ready ID token. The
 * caller exchanges it via `GoogleAuthProvider.credential(idToken)` +
 * `signInWithCredential` (see AuthContext.signInWithGoogle).
 */
export async function getGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInAvailable()) throw new GoogleSignInUnavailableError();

  const { GoogleSignin } = loadModule();
  if (!configured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    });
    configured = true;
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  // v13+ nests the payload under `.data`; earlier versions returned it flat.
  const idToken = result?.data?.idToken ?? result?.idToken ?? null;
  if (!idToken) throw new Error('Google did not return an ID token.');
  return idToken;
}

/**
 * Clear the native Google session. Best-effort companion to Firebase sign-out so
 * the account picker reappears next time; a failure here never blocks logout.
 */
export async function googleSignOut(): Promise<void> {
  if (!isGoogleSignInAvailable() || !cached) return;
  try {
    await cached.GoogleSignin.signOut();
  } catch {
    // Firebase sign-out is the source of truth; ignore native cleanup failures.
  }
}

/** True when the person simply backed out of the Google sheet — a no-op, not an error to surface. */
export function isGoogleCancellation(error: unknown): boolean {
  const code = String((error as { code?: string | number })?.code ?? '');
  // react-native-google-signin status codes for a user-cancelled sign-in.
  return code === 'SIGN_IN_CANCELLED' || code === 'CANCELED' || code === '-5';
}
