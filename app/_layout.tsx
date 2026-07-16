import { ThemeProvider } from '@react-navigation/native';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

/** The route segment groups that make up the logged-out (auth) area. */
function isAuthArea(seg0: string | undefined): boolean {
  return seg0 === undefined || seg0 === 'login' || seg0 === 'signup';
}

/**
 * Redirects between the auth screens and the app based on session state:
 * logged out → welcome; signed in but not onboarded → onboarding; otherwise → feed.
 */
function RootNavigator() {
  const { user, initializing } = useAuth();
  const { session, isLoading } = useUser();
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
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
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
