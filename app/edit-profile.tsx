import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useUser } from '@/store/UserContext';
import { usePosts } from '@/store/PostsContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userProfile, updateProfile } = useUser();
  const { updateAuthorName } = usePosts();

  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [location, setLocation] = useState(userProfile.location);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    name !== userProfile.name ||
    username !== userProfile.username ||
    bio !== userProfile.bio ||
    location !== userProfile.location;

  const avatarLetter = username.trim().charAt(0).toUpperCase() || name.trim().charAt(0).toUpperCase() || '?';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const oldUsername = userProfile.username;
      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        location: location.trim(),
      });
      // Sync the author name on all existing posts
      if (username.trim() !== oldUsername) {
        updateAuthorName(oldUsername, username.trim());
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, styles.saveButton]}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Avatar preview (read-only, derived from username) */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarPreviewText}>{avatarLetter}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#888"
            maxLength={40}
            autoCorrect={false}
          />
          <Text style={styles.charCount}>{name.length}/40</Text>
        </View>

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Username</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor="#888"
            maxLength={24}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Text style={styles.charCount}>{username.length}/24</Text>
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
            placeholderTextColor="#888"
            maxLength={50}
          />
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            placeholderTextColor="#888"
            maxLength={150}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  form: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPreviewText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
});
