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
import { Ember, Radius } from '@/constants/theme';
import { useAuth, authErrorMessage } from '@/store/AuthContext';
import { useUser } from '@/store/UserContext';
import { HANDLE_RE } from '@/lib/handle';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { createProfile } = useUser();

  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanedHandle = handle.trim().toLowerCase();

  const onSubmit = async () => {
    setError(null);
    if (!HANDLE_RE.test(cleanedHandle)) {
      setError('Usernames are 3–20 characters: letters, numbers, or underscores.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Passwords need at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await signUp(email, password, cleanedHandle);
      await createProfile(newUser.uid, cleanedHandle);
      router.replace('/onboarding');
    } catch (e) {
      setError(authErrorMessage(e));
      setSubmitting(false);
    }
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
        <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
        <Text serif style={styles.h1}>
          Find your{' '}
          <Text serif italic style={styles.h1Accent}>
            people
          </Text>
          .
        </Text>
        <Text style={styles.subtitle}>
          Your account is yours alone. Post with your name or stay anonymous — always your choice.
        </Text>

        <View style={styles.fields}>
          <Field label="Username">
            <View style={styles.handleRow}>
              <Text style={styles.handleAt}>@</Text>
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder="yourname"
                placeholderTextColor={Ember.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                style={[styles.input, styles.handleInput]}
              />
            </View>
          </Field>

          <Field label="Email">
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
          </Field>

          <Field label="Password">
            <View style={styles.handleRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={Ember.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                style={[styles.input, styles.handleInput]}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Ember.textMuted}
                />
              </TouchableOpacity>
            </View>
          </Field>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          label={submitting ? 'Creating…' : 'Create account'}
          onPress={onSubmit}
          disabled={submitting}
        />
        {submitting && <ActivityIndicator color={Ember.ember} style={styles.spinner} />}
        <TouchableOpacity onPress={() => router.replace('/login')} hitSlop={8} style={styles.switch}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.input,
    paddingRight: 14,
  },
  handleAt: { color: Ember.textMuted, fontSize: 16, paddingLeft: 16 },
  handleInput: { flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 8 },
  error: { color: '#ff9b73', fontSize: 13, lineHeight: 19, marginTop: 16 },
  footer: { paddingHorizontal: 26, gap: 14 },
  spinner: { position: 'absolute', top: 18, right: 42 },
  switch: { alignItems: 'center' },
  switchText: { color: Ember.textMuted, fontSize: 14 },
  switchLink: { color: Ember.ember, fontWeight: '700' },
});
