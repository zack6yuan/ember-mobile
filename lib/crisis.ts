/**
 * Lightweight, on-device distress detection.
 *
 * This is a *supportive nudge*, not a diagnosis or a filter. It scans for
 * high-signal phrases around suicidal ideation and self-harm and errs toward
 * offering help — a false positive only ever shows a kind message with real
 * resources, so the cost of over-matching is low and the cost of missing is not.
 *
 * Nothing here leaves the device: detection runs entirely locally on text the
 * person is already typing or reading. It never blocks posting.
 */

/** Lowercase, drop apostrophes (so "don't" and "dont" unify), strip remaining
 *  punctuation to spaces, collapse whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// High-signal phrases, kept specific enough to skip common idioms
// ("this is killing me", "I'd die for a coffee") while still catching direct
// expressions of crisis. Matched on word boundaries against normalized text, so
// apostrophes are already stripped ("don't" → "don t").
const DISTRESS_PHRASES: string[] = [
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'end it all',
  'take my own life',
  'want to die',
  'wanna die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'better off without me',
  'no reason to live',
  'nothing to live for',
  'dont want to be here anymore',
  'do not want to be here anymore',
  'dont want to live',
  'want it all to end',
  'suicidal',
  'suicide',
  'hurt myself',
  'hurting myself',
  'harm myself',
  'self harm',
  'cut myself',
  'cutting myself',
  'cant go on',
  'cannot go on',
  'give up on life',
];

/**
 * True when `text` contains a high-signal distress phrase. Word-boundary matched
 * so "diet" won't trip "die" and "suicidezone" won't trip "suicide".
 */
export function detectDistress(text: string): boolean {
  if (!text) return false;
  const padded = ` ${normalize(text)} `;
  return DISTRESS_PHRASES.some((phrase) => padded.includes(` ${phrase} `));
}
