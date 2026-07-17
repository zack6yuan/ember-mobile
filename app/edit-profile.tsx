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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { PresetAvatar } from '@/components/Avatar';
import { Ember, Radius } from '@/constants/theme';
import { AVATAR_PRESETS } from '@/constants/avatars';
import { useUser } from '@/store/UserContext';
import { normalizeHandle, handleError } from '@/lib/handle';
import { pickAvatar } from '@/lib/avatar-upload';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, updateProfile } = useUser();

  const [handle, setHandle] = useState(session?.handle ?? '');
  const [avatar, setAvatar] = useState(session?.avatar ?? 'initial');
  // Photo state, both held as `data:image/jpeg;base64,…` URIs. `photoUrl` is the
  // currently-saved one; a freshly picked `localPhoto` previews and is persisted
  // to the profile doc only on Save.
  const [photoUrl, setPhotoUrl] = useState(session?.avatarUrl ?? '');
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalized = normalizeHandle(handle);
  const initial = normalized.charAt(0).toUpperCase();
  const error = handleError(normalized);
  // The image shown in the preview + used as the avatar (a photo wins over presets).
  const previewPhoto = localPhoto ?? (photoUrl || null);
  const hasPhoto = !!previewPhoto;

  const changed =
    normalized !== session?.handle ||
    avatar !== session?.avatar ||
    localPhoto !== null ||
    photoUrl !== (session?.avatarUrl ?? '');
  const busy = saving || picking;
  const canSave = !error && changed && !busy;

  const onPickPhoto = async () => {
    setPicking(true);
    try {
      const result = await pickAvatar();
      if (result.status === 'picked') {
        setLocalPhoto(result.dataUri);
      } else if (result.status === 'denied') {
        Alert.alert(
          'Photo access needed',
          'Allow photo access in Settings to upload an avatar.'
        );
      }
    } catch {
      Alert.alert('Couldn’t load that photo', 'Please try a different image.');
    } finally {
      setPicking(false);
    }
  };

  const onRemovePhoto = () => {
    setLocalPhoto(null);
    setPhotoUrl('');
  };

  const onSave = async () => {
    if (!canSave || !session) return;
    setSaving(true);
    try {
      // The photo is already a data URI (from the picker) — persist it straight
      // onto the profile doc. `previewPhoto` is null when there's no photo.
      await updateProfile({ handle: normalized, avatar, avatarUrl: previewPhoto ?? '' });
      router.back();
    } catch {
      Alert.alert('Couldn’t save', 'Something went wrong saving your profile. Try again.');
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
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={busy}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Edit profile</Text>
        <TouchableOpacity onPress={onSave} disabled={!canSave} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color={Ember.ember} />
          ) : (
            <Text style={[styles.save, { color: canSave ? Ember.ember : Ember.disabled }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Live preview of the selected avatar */}
        <View style={styles.preview}>
          <PresetAvatar presetId={avatar} imageUrl={previewPhoto} initial={initial} size={84} />
          <Text serif style={styles.previewHandle}>
            @{normalized || 'you'}
          </Text>
        </View>

        {/* Photo upload controls */}
        <View style={styles.photoActions}>
          <TouchableOpacity
            onPress={onPickPhoto}
            disabled={busy}
            style={[styles.photoBtn, busy && styles.photoBtnDisabled]}
            activeOpacity={0.85}
          >
            {picking ? (
              <ActivityIndicator size="small" color={Ember.ember} />
            ) : (
              <Text style={styles.photoBtnText}>{hasPhoto ? 'Change photo' : 'Upload a photo'}</Text>
            )}
          </TouchableOpacity>
          {hasPhoto ? (
            <TouchableOpacity onPress={onRemovePhoto} disabled={busy} hitSlop={6} activeOpacity={0.7}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>{hasPhoto ? 'Or pick a preset' : 'Avatar'}</Text>
        <View style={[styles.grid, hasPhoto && styles.gridDimmed]}>
          {AVATAR_PRESETS.map((preset) => {
            const selected = !hasPhoto && preset.id === avatar;
            return (
              <TouchableOpacity
                key={preset.id}
                onPress={() => {
                  // Choosing a preset clears any uploaded photo (presets are the fallback).
                  setLocalPhoto(null);
                  setPhotoUrl('');
                  setAvatar(preset.id);
                }}
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
  preview: { alignItems: 'center', gap: 10, marginBottom: 18 },
  previewHandle: { fontSize: 20, color: Ember.textPrimary },
  photoActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 26 },
  photoBtn: {
    minWidth: 150,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Ember.ember,
    backgroundColor: Ember.surface3,
  },
  photoBtnDisabled: { opacity: 0.6 },
  photoBtnText: { color: Ember.ember, fontSize: 14, fontWeight: '700' },
  removeText: { color: Ember.textMuted, fontSize: 13, fontWeight: '600' },
  label: {
    color: Ember.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridDimmed: { opacity: 0.45 },
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
