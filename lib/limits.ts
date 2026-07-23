/**
 * Content-quality gates for anything a person writes into Ember.
 *
 * Ember is a place for hard, half-formed thoughts, so these checks are
 * deliberately permissive: they exist to stop empty spam and wall-of-garbage
 * floods, never to tell someone their feelings are too short. Every rejection
 * message is written to sound like a nudge, not a scolding.
 *
 * The length bounds here are mirrored in `firestore.rules` — if you change one,
 * change both, or the server will reject writes the UI thinks are fine.
 */

export const POST_MIN = 2;
export const POST_MAX = 2000;
export const REPLY_MIN = 1;
export const REPLY_MAX = 1000;

export type CheckResult = { ok: true } | { ok: false; message: string };

const OK: CheckResult = { ok: true };

/**
 * Junk detection: a body that's one character repeated ("aaaaaaaaaa", "!!!!!!"),
 * which is what flood-posting actually looks like. Anything under 6 characters
 * is exempt — "ok", "...", and "…" are real things people say.
 *
 * Case is folded first: iOS autocapitalizes the first letter of the field, so a
 * mashed "aaaaaaaaaaaa" actually arrives as "Aaaaaaaaaaaa" and would otherwise
 * read as two distinct characters and slip straight through.
 */
function isRepeatedJunk(body: string): boolean {
  const stripped = body.replace(/\s/g, '').toLowerCase();
  if (stripped.length < 6) return false;
  return new Set(stripped).size === 1;
}

/** Shared body check, parameterized by the bounds for that content type. */
function checkBody(raw: string, min: number, max: number, label: 'post' | 'reply'): CheckResult {
  const body = raw.trim();

  if (body.length === 0) {
    return { ok: false, message: label === 'post' ? 'Write a little something first.' : 'Say something first.' };
  }
  if (body.length < min) {
    return { ok: false, message: 'A few more characters — even a word or two.' };
  }
  if (body.length > max) {
    const over = body.length - max;
    return {
      ok: false,
      message: `That's ${over.toLocaleString()} character${over === 1 ? '' : 's'} past the limit. Try trimming it down.`,
    };
  }
  if (isRepeatedJunk(body)) {
    return { ok: false, message: 'That one got a bit repetitive — try again in your own words.' };
  }
  return OK;
}

export const checkPostBody = (body: string): CheckResult => checkBody(body, POST_MIN, POST_MAX, 'post');

export const checkReplyBody = (body: string): CheckResult => checkBody(body, REPLY_MIN, REPLY_MAX, 'reply');

/**
 * Characters left before the cap, for the composer's counter. Returns null until
 * the person is within `showAt` of the limit — a live counter on an empty box
 * makes writing feel like a test.
 */
export function charsLeft(body: string, max: number, showAt = 200): number | null {
  const left = max - body.trim().length;
  return left <= showAt ? left : null;
}
