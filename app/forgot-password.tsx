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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Ember, Radius } from '@/constants/theme';
import { useAuth, authErrorMessage } from '@/store/AuthContext';

/** A light client-side sanity check; Firebase is the real validator. */
const looksLikeEmail = (value: string) => /.+@.+\..+/.test(value);

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  // The login screen forwards whatever was already typed so we can prefill it.
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The email we confirmed a link was sent to. Non-null flips the screen into
  // its "check your inbox" state.
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Usually pushed from login (so there's a stack to pop), but it's a
  // deep-linkable route — a cold entry has no history, so fall back to /login.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const onSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!looksLikeEmail(trimmed)) {
      setError('Enter the email you signed up with.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(trimmed);
    } catch (e) {
      // Surface only actionable problems (bad email / network). For an unknown
      // account, fall through to the same neutral confirmation so the screen
      // never reveals whether an email is registered.
      const code = (e as { code?: string })?.code ?? '';
      if (code !== 'auth/user-not-found') {
        setError(authErrorMessage(e));
        setSubmitting(false);
        return;
      }
    }
    setSentTo(trimmed);
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Ember.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {sentTo ? (
          <View style={styles.sent}>
            <View style={styles.sentIcon}>
              <Ionicons name="mail-outline" size={30} color={Ember.emberLight} />
            </View>
            <Text serif style={styles.h1}>
              Check your{' '}
              <Text serif italic style={styles.h1Accent}>
                inbox
              </Text>
              .
            </Text>
            <Text style={styles.subtitle}>
              If an account exists for {sentTo}, a link to set a new password is on its way. It can
              take a minute to arrive — remember to peek in spam.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>RESET</Text>
            <Text serif style={styles.h1}>
              Let&apos;s get you{' '}
              <Text serif italic style={styles.h1Accent}>
                back in
              </Text>
              .
            </Text>
            <Text style={styles.subtitle}>
              Enter your email and we&apos;ll send a link to set a new password. No harm done — the
              hearth keeps your spot.
            </Text>

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
                autoFocus={!email}
                style={styles.input}
                onSubmitEditing={onSend}
                returnKeyType="send"
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {sentTo ? (
          <>
            <PrimaryButton label="Back to sign in" onPress={goBack} />
            <TouchableOpacity
              onPress={() => {
                // Let the person correct a typo and try a different address.
                setSentTo(null);
                setError(null);
              }}
              hitSlop={8}
              style={styles.switch}
            >
              <Text style={styles.switchText}>
                Wrong email? <Text style={styles.switchLink}>Try another</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Send reset link'}
              onPress={onSend}
              disabled={submitting}
            />
            {submitting && <ActivityIndicator color={Ember.ember} style={styles.spinner} />}
            <TouchableOpacity onPress={goBack} hitSlop={8} style={styles.switch}>
              <Text style={styles.switchText}>
                Remembered it? <Text style={styles.switchLink}>Back to sign in</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
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
  sent: { paddingTop: 8 },
  sentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Ember.surface3,
    borderWidth: 1,
    borderColor: Ember.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  error: { color: '#ff9b73', fontSize: 13, lineHeight: 19, marginTop: 16 },
  footer: { paddingHorizontal: 26, gap: 14 },
  spinner: { position: 'absolute', top: 18, right: 42 },
  switch: { alignItems: 'center' },
  switchText: { color: Ember.textMuted, fontSize: 14 },
  switchLink: { color: Ember.ember, fontWeight: '700' },
});
