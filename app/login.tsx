import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GoogleButton } from '@/components/GoogleButton';
import { Ember, Radius } from '@/constants/theme';
import { useAuth, authErrorMessage } from '@/store/AuthContext';
import { useUser } from '@/store/UserContext';
import { isGoogleSignInAvailable, isGoogleCancellation } from '@/lib/googleSignIn';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { createProfile } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      // The root navigator redirects to the feed once the session loads.
    } catch (e) {
      setError(authErrorMessage(e));
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setNotice(null);
    setGoogleSubmitting(true);
    try {
      const { user, isNewUser } = await signInWithGoogle();
      // A first-time Google user needs a profile; returning users already have
      // one. Either way the root navigator routes from here (new → onboarding,
      // returning → feed), so we don't navigate manually.
      if (isNewUser) {
        await createProfile(user.uid, user.displayName || 'friend');
      }
    } catch (e) {
      // Backing out of the Google sheet isn't an error worth surfacing.
      if (!isGoogleCancellation(e)) setError(authErrorMessage(e));
      setGoogleSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email above, then tap “Forgot password?” for a reset link.');
      return;
    }

    setResetting(true);
    try {
      await resetPassword(trimmed);
    } catch (e) {
      // Surface only actionable problems (bad email / network). For an unknown
      // account, fall through to the same neutral confirmation so the form
      // never reveals whether an email is registered.
      const code = (e as { code?: string })?.code ?? '';
      if (code !== 'auth/user-not-found') {
        setError(authErrorMessage(e));
        setResetting(false);
        return;
      }
    }
    setNotice(`If an account exists for ${trimmed}, a reset link is on its way. Check your inbox.`);
    setResetting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text serif style={styles.h1}>
          Good to see you{' '}
          <Text serif italic style={styles.h1Accent}>
            again
          </Text>
          .
        </Text>
        <Text style={styles.subtitle}>The hearth is still warm. Pick up where you left off.</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={Ember.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={Ember.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={[styles.input, styles.passwordInput]}
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Ember.textMuted}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={onForgotPassword}
              disabled={resetting}
              hitSlop={8}
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>{resetting ? 'Sending…' : 'Forgot password?'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          label={submitting ? 'Signing in…' : 'Sign in'}
          onPress={onSubmit}
          disabled={submitting}
        />
        {submitting && <ActivityIndicator color={Ember.ember} style={styles.spinner} />}
        {isGoogleSignInAvailable() && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <GoogleButton onPress={onGoogle} loading={googleSubmitting} disabled={submitting} />
          </>
        )}
        <TouchableOpacity onPress={() => router.replace('/signup')} hitSlop={8} style={styles.switch}>
          <Text style={styles.switchText}>
            New here? <Text style={styles.switchLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 4 },
  body: { paddingHorizontal: 26, paddingTop: 14, paddingBottom: 24 },
  eyebrow: { color: Ember.ember, fontSize: 12, fontWeight: '700', letterSpacing: 2.5, marginBottom: 12 },
  h1: { fontSize: 30, lineHeight: 36, color: Ember.textPrimary, marginBottom: 10 },
  h1Accent: { color: Ember.emberLight },
  subtitle: { color: Ember.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 26 },
  fields: { gap: 16 },
  field: { gap: 8 },
  label: { color: Ember.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Ember.textPrimary,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.input,
    paddingRight: 14,
  },
  passwordInput: { flex: 1, backgroundColor: 'transparent', borderWidth: 0 },
  forgot: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 2 },
  forgotText: { color: Ember.ember, fontSize: 13, fontWeight: '600' },
  error: { color: '#ff9b73', fontSize: 13, lineHeight: 19, marginTop: 16 },
  notice: { color: '#8fce7e', fontSize: 13, lineHeight: 19, marginTop: 16 },
  footer: { paddingHorizontal: 26, gap: 14 },
  spinner: { position: 'absolute', top: 18, right: 42 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Ember.border },
  dividerText: { color: Ember.textMuted, fontSize: 12, fontWeight: '600' },
  switch: { alignItems: 'center' },
  switchText: { color: Ember.textMuted, fontSize: 14 },
  switchLink: { color: Ember.ember, fontWeight: '700' },
});
