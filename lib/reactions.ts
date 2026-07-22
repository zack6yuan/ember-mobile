import { Ember } from '@/constants/theme';

/** The warmth gestures a post or reply can receive, widest-used first. */
export type ReactionId = 'hug' | 'heart' | 'candle' | 'metoo' | 'strength';

export type ReactionDef = {
  id: ReactionId;
  emoji: string;
  /** Short accessible name / resting label (e.g. under a detail-screen pill). */
  label: string;
  /** Label shown once you've reacted, when there's room (post detail only). */
  activeLabel: string;
  /** Tint applied to the emoji + count when you've reacted. */
  color: string;
  /** How this reaction reads in the notifications feed: "Someone <phrase>". */
  notifPhrase: string;
  // Where the count + who-reacted list live on a stored post document. Kept as
  // explicit fields (not a map) so the seeded baseline counts survive and the
  // Firestore `increment` never resets a legacy post's tally.
  countField: string;
  byField: string;
};

export const REACTIONS: ReactionDef[] = [
  {
    id: 'hug',
    emoji: '🫂',
    label: 'Hug',
    activeLabel: 'Held',
    color: Ember.reactionWarm,
    notifPhrase: 'sent a hug on your post',
    countField: 'hugs',
    byField: 'hugBy',
  },
  {
    id: 'heart',
    emoji: '🧡',
    label: 'Heart',
    activeLabel: 'Hearted',
    color: Ember.ember,
    notifPhrase: 'hearted your post',
    countField: 'hearts',
    byField: 'heartBy',
  },
  {
    id: 'candle',
    emoji: '🕯️',
    label: 'Holding space',
    activeLabel: 'Holding space',
    color: Ember.emberLight,
    notifPhrase: 'is holding space for you',
    countField: 'candles',
    byField: 'candleBy',
  },
  {
    id: 'metoo',
    emoji: '🙋',
    label: 'Me too',
    activeLabel: 'Me too',
    color: Ember.reactionWarm,
    notifPhrase: 'said “me too”',
    countField: 'metoos',
    byField: 'metooBy',
  },
  {
    id: 'strength',
    emoji: '✊',
    label: 'Strength',
    activeLabel: 'Strength',
    color: Ember.emberLight,
    notifPhrase: 'sent you strength',
    countField: 'strengths',
    byField: 'strengthBy',
  },
];

export const REACTION_IDS: ReactionId[] = REACTIONS.map((r) => r.id);

export const reactionById = (id: ReactionId): ReactionDef | undefined =>
  REACTIONS.find((r) => r.id === id);

/** Every post-document field the reaction system may touch (for Firestore rules parity). */
export const POST_REACTION_FIELDS: string[] = REACTIONS.flatMap((r) => [r.countField, r.byField]);
