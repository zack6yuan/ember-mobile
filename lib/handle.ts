/** Username rules, shared by signup and profile editing. */

/** 3–20 chars: lowercase letters, numbers, underscores. */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/** Trim + lowercase raw input into a candidate handle. */
export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Validation message for a (normalized) handle, or null when it's valid. */
export function handleError(handle: string): string | null {
  if (!HANDLE_RE.test(handle)) {
    return 'Usernames are 3–20 characters: letters, numbers, or underscores.';
  }
  return null;
}

/**
 * Derive a valid starter @handle from a seed (e.g. a Google display name or the
 * local-part of an email). Strips anything outside the allowed set, clamps to
 * 3–20 chars, and falls back to a random "friend_xxxx" when too little remains.
 * The result always satisfies {@link HANDLE_RE}. Used for first-time Google
 * users, who never typed a username; they can change it later in the profile.
 */
export function suggestHandle(seed: string): string {
  const cleaned = seed.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  if (cleaned.length >= 3) return cleaned;
  return `friend_${Math.random().toString(36).slice(2, 6)}`;
}
