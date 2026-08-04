import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Push notifications wrapper (issue #10).
 *
 * Written and wired end-to-end but kept DORMANT behind {@link PUSH_NOTIFICATIONS_ENABLED},
 * exactly like the Google sign-in module (issue #1 / lib/googleSignIn.ts). Remote
 * push cannot run in Expo Go — it needs a **custom dev build** — so while the flag
 * is off nothing here executes and the app builds and runs exactly as before.
 *
 * `expo-notifications` is loaded through a runtime `require` and, while the package
 * isn't installed, Metro resolves it to a local stub (see metro.config.js and
 * lib/expoNotificationsStub.js), so the Expo Go and web bundles keep building.
 *
 * To turn it on, after graduating the dev loop to a custom dev build:
 *   1. npx expo install expo-notifications
 *   2. Add the `expo-notifications` plugin + an EAS `projectId` to app.json
 *      (see PUSH_NOTIFICATIONS_SETUP.md)
 *   3. Deploy the Cloud Function sender (functions/) that actually pushes
 *   4. Flip PUSH_NOTIFICATIONS_ENABLED to true and rebuild the dev client
 * Everything downstream (app/_layout.tsx registration + tap handling) reads
 * {@link isPushNotificationsAvailable}, so that's the only switch you need.
 */
export const PUSH_NOTIFICATIONS_ENABLED = false;

/** Android notification channel id used for warmth (hugs/hearts/replies). */
export const ANDROID_CHANNEL_ID = 'warmth';

/**
 * Whether push can actually run here. Gated on the flag and the platform: remote
 * push has no meaning on web, so registration stays off there.
 */
export function isPushNotificationsAvailable(): boolean {
  return PUSH_NOTIFICATIONS_ENABLED && Platform.OS !== 'web';
}

/** The data payload the sender attaches to a push, used to deep-link on tap. */
export type PushData = {
  postId?: string;
  type?: string;
};

/** The slice of `expo-notifications` we use, typed locally so we don't depend on it. */
type NotificationSubscription = { remove(): void };
type NotificationResponse = {
  notification: { request: { content: { data?: PushData | null } } };
};
type ExpoNotificationsModule = {
  setNotificationHandler(handler: {
    handleNotification(): Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
  getPermissionsAsync(): Promise<{ status: string; granted?: boolean }>;
  requestPermissionsAsync(): Promise<{ status: string; granted?: boolean }>;
  getExpoPushTokenAsync(opts?: { projectId?: string }): Promise<{ data: string }>;
  setNotificationChannelAsync(id: string, channel: Record<string, unknown>): Promise<unknown>;
  addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): NotificationSubscription;
  getLastNotificationResponseAsync(): Promise<NotificationResponse | null>;
  AndroidImportance: { DEFAULT: number; HIGH: number };
};

let cached: ExpoNotificationsModule | null = null;

/**
 * Load the native module lazily. Metro resolves it to a local stub while the
 * package isn't installed; in a dev build with the package present, this is the
 * real native module. Only ever reached when the flag is on.
 */
function loadModule(): ExpoNotificationsModule {
  if (cached) return cached;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cached = require('expo-notifications') as ExpoNotificationsModule;
  return cached;
}

/** The EAS project id `getExpoPushTokenAsync` needs to mint a token. */
function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // easConfig is present in EAS builds; expoConfig.extra is the app.json path.
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

let handlerConfigured = false;

/**
 * Tell the OS how to present a push that arrives while the app is foregrounded.
 * Idempotent; safe to call on every mount. No-ops when push is unavailable.
 */
export function configureForegroundHandler(): void {
  if (!isPushNotificationsAvailable() || handlerConfigured) return;
  const N = loadModule();
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
}

/**
 * Request permission (if not already granted), set up the Android channel, and
 * return this device's Expo push token — or null if push is unavailable or the
 * person declined. The caller stores the token on the user's profile so the
 * Cloud Function sender can reach this device (see store/UserContext).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isPushNotificationsAvailable()) return null;
  const N = loadModule();

  // Android requires a channel before any notification will surface.
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Warmth',
      importance: N.AndroidImportance.DEFAULT,
    });
  }

  const existing = await N.getPermissionsAsync();
  let granted = existing.granted ?? existing.status === 'granted';
  if (!granted) {
    const requested = await N.requestPermissionsAsync();
    granted = requested.granted ?? requested.status === 'granted';
  }
  if (!granted) return null;

  try {
    const token = await N.getExpoPushTokenAsync({ projectId: projectId() });
    return token.data;
  } catch (e) {
    // Missing projectId, a network hiccup, or a simulator without push support:
    // never let token minting crash the app — warmth still lands in-app.
    console.warn('Failed to get Expo push token:', e);
    return null;
  }
}

/**
 * Subscribe to notification taps. Returns an unsubscribe function; a no-op when
 * push is unavailable. The handler receives the {@link PushData} the sender
 * attached (e.g. the postId to open).
 */
export function addNotificationTapListener(
  onTap: (data: PushData) => void
): () => void {
  if (!isPushNotificationsAvailable()) return () => {};
  const N = loadModule();
  const sub = N.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data) onTap(data);
  });
  return () => sub.remove();
}

/**
 * The tap that cold-launched the app, if any (the warm-path listener doesn't
 * fire for a notification opened from a killed state). Resolves to null when
 * push is unavailable or the app was opened normally.
 */
export async function getLaunchTapData(): Promise<PushData | null> {
  if (!isPushNotificationsAvailable()) return null;
  const N = loadModule();
  const response = await N.getLastNotificationResponseAsync();
  return response?.notification.request.content.data ?? null;
}
