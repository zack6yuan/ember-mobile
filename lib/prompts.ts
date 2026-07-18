/**
 * Gentle daily prompts. One is surfaced per calendar day (deterministically, so
 * everyone sees the same prompt on the same day) to spark posting without
 * pressure. Warm and open-ended by design — never clinical, never a chore.
 */
const PROMPTS: string[] = [
  'What’s one small thing that got you through today?',
  'What are you carrying right now that you haven’t said out loud?',
  'Name one thing you’re proud of — however small.',
  'Who or what are you grateful for today?',
  'What would you tell a friend feeling the way you feel right now?',
  'What’s something you’re looking forward to, even a little?',
  'What did today ask of you?',
  'Where did you notice a moment of quiet today?',
  'What’s a win nobody else would clap for, but you know mattered?',
  'What do you need more of this week?',
  'What’s been heavy lately? You can set it down here.',
  'What’s one kind thing you could do for yourself tonight?',
  'What surprised you today?',
  'If today had a color, what would it be — and why?',
  'What’s something you’re still hoping for?',
];

/** Day index since the epoch, in local time — stable for the whole calendar day. */
function dayIndex(d = new Date()): number {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** The prompt for today. Rotates once per day and wraps around the list. */
export function promptForToday(): string {
  return PROMPTS[((dayIndex() % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
}
