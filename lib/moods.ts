/** The five moods offered in the daily check-in, from heaviest to brightest. */
export type Mood = { id: string; emoji: string; label: string };

export const MOODS: Mood[] = [
  { id: 'struggling', emoji: '🌧️', label: 'Struggling' },
  { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'bright', emoji: '☀️', label: 'Bright' },
];

export const moodById = (id?: string): Mood | undefined => MOODS.find((m) => m.id === id);
