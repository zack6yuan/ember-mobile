import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Longest edge of the stored avatar. Small on purpose: the image is kept as a
 * base64 data URI inside the Firestore profile doc (no Cloud Storage / Blaze
 * plan needed), so it must stay well under Firestore's 1MB document limit. A
 * 256px JPEG at 0.8 quality lands around ~20–40KB.
 */
const AVATAR_SIZE = 256;

export type PickAvatarResult =
  | { status: 'picked'; dataUri: string }
  | { status: 'cancelled' }
  | { status: 'denied' };

/**
 * Full avatar flow: ask for library permission, let the user pick + square-crop
 * a photo, downscale it to a small {@link AVATAR_SIZE}px JPEG, and return it as a
 * `data:image/jpeg;base64,…` URI. Callers persist that string on the profile
 * (`session.avatarUrl`); `expo-image` renders data URIs directly.
 */
export async function pickAvatar(): Promise<PickAvatarResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'denied' };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (picked.canceled || !picked.assets?.length) return { status: 'cancelled' };

  const manipulated = await ImageManipulator.manipulate(picked.assets[0].uri)
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
    .renderAsync();
  const output = await manipulated.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });
  if (!output.base64) throw new Error('Failed to encode image');
  return { status: 'picked', dataUri: `data:image/jpeg;base64,${output.base64}` };
}
