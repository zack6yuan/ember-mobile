/**
 * Time-of-day theming for the feed. Mirrors the hour buckets behind the feed
 * greeting (see lib/greeting) and extends them into a subtly cozier background:
 * the warmth deepens toward the small hours, coziest for the #latenight crowd.
 */

import { Ember } from '@/constants/theme';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'latenight';

/** The time-of-day bucket for a given hour (0–23). */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21) return 'night'; // 9pm–midnight
  return 'latenight'; // midnight–5am
}

/**
 * A gentle top→bottom wash painted behind the feed. The top stop carries the
 * warmth (barely there by day, a deep ember glow after dark); the bottom stop
 * settles into the base background so cards still read cleanly on top.
 */
const BACKDROPS: Record<TimeOfDay, readonly [string, string]> = {
  morning: ['#17110b', Ember.bg],
  afternoon: ['#130d09', Ember.bg],
  evening: ['#1d1209', Ember.bg],
  night: ['#221309', Ember.bgDeep],
  latenight: ['#2b1608', '#0a0604'],
};

/** Feed backdrop gradient for the current time — pass `now` in tests. */
export function feedBackdrop(now: Date = new Date()): readonly [string, string] {
  return BACKDROPS[timeOfDay(now.getHours())];
}
