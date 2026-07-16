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
