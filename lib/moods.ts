/**
 * The five moods offered in the daily check-in, from heaviest to brightest.
 * `tint` runs cool→warm so a strip or ring of recent moods reads as a gradient
 * from harder days to brighter ones.
 */
export type Mood = { id: string; emoji: string; label: string; tint: string };

export const MOODS: Mood[] = [
  { id: 'struggling', emoji: '🌧️', label: 'Struggling', tint: '#6f8fb0' },
  { id: 'low', emoji: '😔', label: 'Low', tint: '#8b8bb4' },
  { id: 'okay', emoji: '😐', label: 'Okay', tint: '#b6a48f' },
  { id: 'good', emoji: '🙂', label: 'Good', tint: '#f0a355' },
  { id: 'bright', emoji: '☀️', label: 'Bright', tint: '#ffcc66' },
];

export const moodById = (id?: string): Mood | undefined => MOODS.find((m) => m.id === id);
