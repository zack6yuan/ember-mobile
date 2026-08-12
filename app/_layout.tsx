import { ThemeProvider } from '@react-navigation/native';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_500Medium_Italic,
} from '@expo-google-fonts/newsreader';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';

import { AuthProvider, useAuth } from '@/store/AuthContext';
import { PostsProvider } from '@/store/PostsContext';
import { UserProvider, useUser } from '@/store/UserContext';
import { Ember, EmberNavTheme } from '@/constants/theme';
import {
  addNotificationTapListener,
  configureForegroundHandler,
  getLaunchTapData,
  isPushNotificationsAvailable,
  registerForPushNotificationsAsync,
  type PushData,
} from '@/lib/pushNotifications';

SplashScreen.preventAutoHideAsync();

/** The route segment groups that make up the logged-out (auth) area. */
function isAuthArea(seg0: string | undefined): boolean {
  return (
    seg0 === undefined ||
    seg0 === 'login' ||
    seg0 === 'signup' ||
    seg0 === 'forgot-password'
  );
}

/**
 * Redirects between the auth screens and the app based on session state:
 * logged out → welcome; signed in but not onboarded → onboarding; otherwise → feed.
 */
function RootNavigator() {
  const { user, initializing } = useAuth();
  const { session, isLoading, registerPushToken } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Hold the splash until auth is resolved and, for a signed-in user, until the
  // profile load has *settled* (succeeded or failed) — never block on the
  // session existing, or a failed load would strand the user on the splash
  // screen forever.
  const ready = !initializing && (!user || !isLoading);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const seg0 = segments[0];

    if (!user) {
      if (!isAuthArea(seg0)) router.replace('/');
      return;
    }
    // Signed in and the profile load has settled. If the profile is still
    // missing (a transient load failure), fall through into the app rather than
    // stranding the user on an auth screen.
    if (session && !session.onboarded) {
      if (seg0 !== 'onboarding') router.replace('/onboarding');
    } else if (isAuthArea(seg0) || seg0 === 'onboarding') {
      router.replace('/(tabs)/feed');
    }
  }, [ready, user, session, segments, router]);

  // --- Push notifications (issue #10) -------------------------------------
  // All of this is gated on isPushNotificationsAvailable() — the flag is off and
  // hidden on web, so in Expo Go / web these effects do nothing.

  // Configure how a push shows while the app is foregrounded (once).
  useEffect(() => {
    configureForegroundHandler();
  }, []);

  // Register this device's Expo push token once the profile is loaded, so the
  // sender can reach it. registerPushToken no-ops without a session.
  useEffect(() => {
    if (!isPushNotificationsAvailable() || !session) return;
    let active = true;
    registerForPushNotificationsAsync().then((token) => {
      if (active && token) registerPushToken(token);
    });
    return () => {
      active = false;
    };
  }, [session, registerPushToken]);

  // Open the post a notification points at. Warm taps arrive via the listener;
  // a cold-launch tap is read once, and only after the navigator is ready and a
  // user is signed in, so it isn't clobbered by the auth redirect above.
  const launchHandled = useRef(false);
  useEffect(() => {
    if (!isPushNotificationsAvailable()) return;
    const open = (data: PushData) => {
      if (data.postId) router.push(`/post/${data.postId}`);
    };
    const unsubscribe = addNotificationTapListener(open);
    if (ready && user && !launchHandled.current) {
      launchHandled.current = true;
      getLaunchTapData().then((data) => {
        if (data) open(data);
      });
    }
    return unsubscribe;
  }, [ready, user, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Ember.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="breathe" options={{ presentation: 'modal' }} />
      <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="posted" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={EmberNavTheme}>
      <AuthProvider>
        <UserProvider>
          <PostsProvider>
            <RootNavigator />
          </PostsProvider>
        </UserProvider>
      </AuthProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
