/**
 * Client-side rate limiting — the first line of defence against flooding.
 *
 * Two gates per action: a short *cooldown* between consecutive actions, and a
 * *cap* over a rolling window. Timestamps are kept in memory for speed and
 * mirrored to AsyncStorage so a limit survives force-quitting the app (the
 * obvious way to get around a purely in-memory counter).
 *
 * This is a UX guardrail on a warm app, not a security boundary — a determined
 * client can always talk to Firestore directly, which is why the real integrity
 * checks live in `firestore.rules`. What this buys us is that ordinary spam,
 * rage-posting, and stuck-button loops stop before they reach the network.
 *
 * The numbers are set so a person having the worst night of their life never
 * touches them: 30s between posts still allows a long, raw thread of thoughts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActionId = 'post' | 'reply' | 'reaction' | 'report';

type Rule = {
  /** Minimum gap between two of these actions. */
  cooldownMs: number;
  /** Most actions allowed inside `windowMs`. */
  max: number;
  windowMs: number;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const RULES: Record<ActionId, Rule> = {
  // Long enough to break a flood, short enough that a real thought isn't blocked.
  post: { cooldownMs: 30 * SECOND, max: 15, windowMs: HOUR },
  reply: { cooldownMs: 5 * SECOND, max: 60, windowMs: HOUR },
  // A burst guard for stuck taps, not a real limit — no human reacts 120x in 5min.
  reaction: { cooldownMs: 0, max: 120, windowMs: 5 * MINUTE },
  report: { cooldownMs: 10 * SECOND, max: 20, windowMs: HOUR },
};

/** Warm copy for each action when the rolling cap (not the cooldown) is hit. */
const CAP_MESSAGE: Record<ActionId, string> = {
  post: "You've shared a lot in the last hour. Take a breath — the feed will still be here.",
  reply: "That's a lot of replies in one hour. Rest your hands for a bit.",
  reaction: 'Slow down a moment — that was a lot of warmth very fast.',
  report: "You've filed a lot of reports in the last hour. We're on them.",
};

export type LimitResult = { ok: true } | { ok: false; message: string; retryInMs: number };

const key = (uid: string, action: ActionId) => `ember:ratelimit:${uid}:${action}`;

/** In-memory mirror of what's on disk, so the hot path doesn't await storage twice. */
const cache = new Map<string, number[]>();

async function load(uid: string, action: ActionId): Promise<number[]> {
  const k = key(uid, action);
  const cached = cache.get(k);
  if (cached) return cached;
  let stamps: number[] = [];
  try {
    const raw = await AsyncStorage.getItem(k);
    // A corrupt or hand-edited value should never wedge posting — fall back to empty.
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) stamps = parsed.filter((n): n is number => typeof n === 'number');
    }
  } catch {
    stamps = [];
  }
  cache.set(k, stamps);
  return stamps;
}

function save(uid: string, action: ActionId, stamps: number[]) {
  // Fire-and-forget: the in-memory copy is authoritative for this session, and a
  // failed persist should never block someone from posting.
  AsyncStorage.setItem(key(uid, action), JSON.stringify(stamps)).catch(() => {});
}

/** "in 24s" / "in 3 minutes" — vague on purpose, so it reads as a pause, not a punishment. */
export function describeWait(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / SECOND));
  if (seconds < 60) return `in ${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Check whether `action` is allowed right now, without recording it. Use this
 * for disabled-button state; use `consume` at the moment the action fires.
 */
export async function checkLimit(uid: string, action: ActionId): Promise<LimitResult> {
  const rule = RULES[action];
  const now = Date.now();
  const stamps = (await load(uid, action)).filter((t) => now - t < rule.windowMs);

  const last = stamps.length ? Math.max(...stamps) : 0;
  const sinceLast = now - last;
  if (last && sinceLast < rule.cooldownMs) {
    const retryInMs = rule.cooldownMs - sinceLast;
    return {
      ok: false,
      retryInMs,
      message:
        action === 'post'
          ? `Give it a moment — you can post again ${describeWait(retryInMs)}.`
          : `One moment — try again ${describeWait(retryInMs)}.`,
    };
  }

  if (stamps.length >= rule.max) {
    const oldest = Math.min(...stamps);
    const retryInMs = rule.windowMs - (now - oldest);
    return { ok: false, retryInMs, message: CAP_MESSAGE[action] };
  }

  return { ok: true };
}

/**
 * Check and, if allowed, record the action. Call this immediately before doing
 * the work — a caller that checks but never consumes will never be limited.
 */
export async function consume(uid: string, action: ActionId): Promise<LimitResult> {
  const result = await checkLimit(uid, action);
  if (!result.ok) return result;

  const rule = RULES[action];
  const now = Date.now();
  const stamps = [...(await load(uid, action)).filter((t) => now - t < rule.windowMs), now];
  cache.set(key(uid, action), stamps);
  save(uid, action, stamps);
  return { ok: true };
}

/** Drop a user's counters — used on sign-out so the next account starts clean. */
export async function clearLimits(uid: string): Promise<void> {
  const keys = (Object.keys(RULES) as ActionId[]).map((a) => key(uid, a));
  keys.forEach((k) => cache.delete(k));
  await AsyncStorage.multiRemove(keys).catch(() => {});
}
