/**
 * Gentle milestones that celebrate *showing up*, not vanity metrics. Each one is
 * earned by presence — sharing, returning day after day, or holding space for
 * others — and is surfaced (earned or still ahead) on the profile.
 */

export type MilestoneStats = {
  /** Posts this person has shared. */
  embersShared: number;
  /** Best streak of consecutive days they've returned. */
  longestStreak: number;
  /** Total warmth their posts have received — people their words reached. */
  peopleHeld: number;
};

export type Milestone = {
  id: string;
  emoji: string;
  /** Short badge label, e.g. "First ember". */
  title: string;
  /** Warm one-line description of what it honors. */
  detail: string;
  earned: (s: MilestoneStats) => boolean;
};

/** Ordered easiest → hardest, so the list reads as a path forward. */
export const MILESTONES: Milestone[] = [
  {
    id: 'first-ember',
    emoji: '🔥',
    title: 'First ember',
    detail: 'Your first post',
    earned: (s) => s.embersShared >= 1,
  },
  {
    id: 'first-week',
    emoji: '🕯️',
    title: 'Seven days',
    detail: 'Showed up a week',
    earned: (s) => s.longestStreak >= 7,
  },
  {
    id: 'held-ten',
    emoji: '🤲',
    title: 'Held ten',
    detail: 'Ten felt your warmth',
    earned: (s) => s.peopleHeld >= 10,
  },
  {
    id: 'ten-embers',
    emoji: '✍️',
    title: 'Ten embers',
    detail: 'Ten posts shared',
    earned: (s) => s.embersShared >= 10,
  },
  {
    id: 'first-month',
    emoji: '🌙',
    title: 'Thirty days',
    detail: 'A month of showing up',
    earned: (s) => s.longestStreak >= 30,
  },
  {
    id: 'held-hundred',
    emoji: '🫂',
    title: 'Held a hundred',
    detail: 'A hundred, held',
    earned: (s) => s.peopleHeld >= 100,
  },
];

/** Split milestones into earned and still-ahead, preserving the ordered path. */
export function splitMilestones(stats: MilestoneStats): { earned: Milestone[]; ahead: Milestone[] } {
  const earned: Milestone[] = [];
  const ahead: Milestone[] = [];
  for (const m of MILESTONES) (m.earned(stats) ? earned : ahead).push(m);
  return { earned, ahead };
}
