import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { PresetAvatar } from '@/components/Avatar';
import { Ember, Radius } from '@/constants/theme';
import { AVATAR_PRESETS } from '@/constants/avatars';
import { useUser } from '@/store/UserContext';
import { normalizeHandle, handleError } from '@/lib/handle';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, updateProfile } = useUser();

  const [handle, setHandle] = useState(session?.handle ?? '');
  const [avatar, setAvatar] = useState(session?.avatar ?? 'initial');
  const [saving, setSaving] = useState(false);

  const normalized = normalizeHandle(handle);
  const initial = normalized.charAt(0).toUpperCase();
  const error = handleError(normalized);
  const changed = normalized !== session?.handle || avatar !== session?.avatar;
  const canSave = !error && changed && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateProfile({ handle: normalized, avatar });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Edit profile</Text>
        <TouchableOpacity onPress={onSave} disabled={!canSave} hitSlop={8}>
          <Text style={[styles.save, { color: canSave ? Ember.ember : Ember.disabled }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Live preview of the selected avatar */}
        <View style={styles.preview}>
          <PresetAvatar presetId={avatar} initial={initial} size={84} />
          <Text serif style={styles.previewHandle}>
            @{normalized || 'you'}
          </Text>
        </View>

        <Text style={styles.label}>Avatar</Text>
        <View style={styles.grid}>
          {AVATAR_PRESETS.map((preset) => {
            const selected = preset.id === avatar;
            return (
              <TouchableOpacity
                key={preset.id}
                onPress={() => setAvatar(preset.id)}
                activeOpacity={0.85}
                style={[styles.gridItem, selected && styles.gridItemSelected]}
              >
                <PresetAvatar presetId={preset.id} initial={initial} size={54} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 26 }]}>Username</Text>
        <View style={styles.handleRow}>
          <Text style={styles.handleAt}>@</Text>
          <TextInput
            value={handle}
            onChangeText={setHandle}
            placeholder="yourname"
            placeholderTextColor="#6f625a"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={20}
            style={styles.input}
          />
        </View>
        {error && changed ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>
          Changing your username won&apos;t rename it on posts you&apos;ve already shared.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  cancel: { color: Ember.textSecondary, fontSize: 15 },
  topTitle: { color: Ember.textMutedDeep, fontSize: 13, fontWeight: '600' },
  save: { fontSize: 15, fontWeight: '700' },
  scroll: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 60 },
  preview: { alignItems: 'center', gap: 10, marginBottom: 26 },
  previewHandle: { fontSize: 20, color: Ember.textPrimary },
  label: {
    color: Ember.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    padding: 3,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: { borderColor: Ember.ember },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: Radius.input,
  },
  handleAt: { color: Ember.textMuted, fontSize: 16, paddingLeft: 16 },
  input: {
    flex: 1,
    color: Ember.textPrimary,
    fontSize: 16,
    fontFamily: 'HankenGrotesk_400Regular',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  error: { color: '#ff9a7a', fontSize: 12, marginTop: 8 },
  hint: { color: Ember.textMutedDeep, fontSize: 12, lineHeight: 18, marginTop: 10 },
});
