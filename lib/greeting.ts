/**
 * Time-of-day greeting for the feed header, in Ember's warm "glow" voice.
 * Accounts only store a username handle, so we derive a first-name-ish label
 * from it for the greeting.
 */

/** First name from an account handle: leading letters, capitalized. "zack6yuan" → "Zack". */
export function firstNameFromHandle(handle?: string | null): string {
  if (!handle) return 'friend';
  const match = handle.match(/^[a-zA-Z]+/);
  const base = match ? match[0] : '';
  if (!base) return 'friend';
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

/** The greeting phrase for the given hour (0–23), no name attached. */
function phraseForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Rise and glow'; // morning
  if (hour >= 12 && hour < 17) return 'Burning bright'; // afternoon
  if (hour >= 17 && hour < 21) return 'Golden hour'; // evening
  return 'Rest easy'; // night (9pm–5am)
}

/** e.g. "Golden hour, Zack" — pass `now` in tests, defaults to the current time. */
export function emberGreeting(name: string, now: Date = new Date()): string {
  return `${phraseForHour(now.getHours())}, ${name}`;
}
