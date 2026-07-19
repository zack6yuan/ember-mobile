import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { reportContent, type ReportReasonId } from '@/lib/moderation';
import { notify } from '@/lib/notifications';
import { REACTIONS, reactionById, type ReactionId } from '@/lib/reactions';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/store/AuthContext';

export type IdentityMode = 'anonymous' | 'named';
export type Identity = { mode: IdentityMode; handle?: string };

export type TagId =
  | 'venting'
  | 'wins'
  | 'advice'
  | 'gratitude'
  | 'latenight'
  | 'lonely'
  | 'healing'
  | 'heartbreak'
  | 'work'
  | 'grief'
  | 'hope';

export type Reply = {
  id: string;
  author: Identity;
  authorUid?: string; // who wrote it (absent on legacy replies) — enables block/report
  body: string;
  createdAt: string; // display string, e.g. "2m"
  reactions: Record<ReactionId, number>; // count per warmth gesture
  myReactions: Record<ReactionId, boolean>; // which ones the current user has left
};

/** A person the current user has blocked (name is captured at block time). */
export type BlockedUser = { uid: string; name: string; blockedAt: number };

export type Post = {
  id: string;
  author: Identity;
  authorUid?: string; // who wrote it — enables block/report (absent on legacy posts)
  tag: TagId;
  body: string;
  reactions: Record<ReactionId, number>; // count per warmth gesture
  myReactions: Record<ReactionId, boolean>; // which ones the current user has left
  replies: Reply[];
  createdAt: string; // display string, e.g. "4m"
  mine?: boolean; // authored by the current user (shown in their profile)
  saved?: boolean;
};

export type Community = {
  tag: TagId;
  emoji: string;
  name: string; // e.g. "#venting"
  description: string;
  count: number; // people here right now
};

export const COMMUNITIES: Community[] = [
  { tag: 'venting', emoji: '💨', name: '#venting', description: 'Get it off your chest', count: 218 },
  { tag: 'wins', emoji: '🎉', name: '#wins', description: 'Celebrate the small stuff', count: 96 },
  { tag: 'advice', emoji: '💬', name: '#advice', description: 'Ask, and be heard', count: 143 },
  { tag: 'gratitude', emoji: '🕯️', name: '#gratitude', description: 'Notice the good', count: 74 },
  { tag: 'latenight', emoji: '🌙', name: '#latenight', description: 'For the 3am thoughts', count: 51 },
  { tag: 'lonely', emoji: '🫂', name: '#lonely', description: "For when no one's around", count: 63 },
  { tag: 'healing', emoji: '🌱', name: '#healing', description: 'One small step forward', count: 88 },
  { tag: 'heartbreak', emoji: '💔', name: '#heartbreak', description: 'Love, loss, and letting go', count: 47 },
  { tag: 'work', emoji: '💼', name: '#work', description: 'Burnout, bosses, and Mondays', count: 112 },
  { tag: 'grief', emoji: '🕊️', name: '#grief', description: "Carrying what we've lost", count: 29 },
  { tag: 'hope', emoji: '☀️', name: '#hope', description: 'Reasons to keep going', count: 55 },
];

export const TAG_ORDER: TagId[] = [
  'venting',
  'wins',
  'advice',
  'gratitude',
  'latenight',
  'lonely',
  'healing',
  'heartbreak',
  'work',
  'grief',
  'hope',
];

const anon = (): Identity => ({ mode: 'anonymous' });
const named = (handle: string): Identity => ({ mode: 'named', handle });

/** Firestore never accepts `undefined`; drop the handle when it isn't a real named identity. */
const cleanIdentity = (identity: Identity): Identity =>
  identity.mode === 'named' && identity.handle ? { mode: 'named', handle: identity.handle } : { mode: 'anonymous' };

// --- Firestore document shapes (stored) — timestamps are epoch ms ------------
type StoredReply = {
  id: string;
  author: Identity;
  authorUid?: string;
  body: string;
  createdAt: number;
  // Who left each warmth gesture on this reply. Counts are derived from length,
  // so replies (unlike posts) carry no seeded baseline.
  reactBy?: Partial<Record<ReactionId, string[]>>;
};
type StoredPost = {
  id: string; // Firestore doc id (added on read)
  authorUid: string | null;
  author: Identity;
  tag: TagId;
  body: string;
  hugs: number;
  hearts: number;
  hugBy: string[];
  heartBy: string[];
  replies: StoredReply[];
  createdAt: number;
  seeded?: boolean; // demo content — never counted as the current user's own post
  // Reaction fields beyond hug/heart are optional so legacy/seed posts read as 0.
  // Read dynamically via each reaction's countField/byField (see lib/reactions).
  candles?: number;
  candleBy?: string[];
  metoos?: number;
  metooBy?: string[];
  strengths?: number;
  strengthBy?: string[];
};

/** Read a stored post's reaction field by its (string) name, coping with the dynamic key. */
const field = (post: StoredPost, name: string): unknown => (post as Record<string, unknown>)[name];

// --- Seed content (written once to an empty collection) ----------------------
const MIN = 60_000;
type SeedPost = Omit<StoredPost, 'id' | 'authorUid' | 'hugBy' | 'heartBy' | 'seeded'>;

const SEED_POSTS: SeedPost[] = [
  {
    author: anon(),
    tag: 'venting',
    body: "Third night I can't sleep. Feels like everyone moved on with their lives and I'm just… stuck.",
    hugs: 34,
    hearts: 12,
    candles: 15,
    metoos: 22,
    createdAt: Date.now() - 4 * MIN,
    replies: [
      { id: 'r1', author: anon(), body: 'Stuck is still a place you can leave. Been there. It gets lighter.', createdAt: Date.now() - 2 * MIN },
      { id: 'r2', author: named('leo'), body: "Sitting with you tonight. You're not as behind as it feels. 🕯️", createdAt: Date.now() - 1 * MIN },
      { id: 'r3', author: anon(), body: 'The 3am hours lie to you. Morning always has a different opinion.', createdAt: Date.now() - 1 * MIN },
    ],
  },
  {
    author: named('mia_r'),
    tag: 'wins',
    body: "Finally sent the email I'd been dreading for a month. Hands were shaking but I did it 🎉",
    hugs: 8,
    hearts: 51,
    strengths: 30,
    createdAt: Date.now() - 20 * MIN,
    replies: [
      { id: 'r4', author: anon(), body: 'That first send is the hardest part. Proud of you.', createdAt: Date.now() - 12 * MIN },
      { id: 'r5', author: named('sam'), body: 'Shaking hands still hit send. That’s courage. 🎉', createdAt: Date.now() - 8 * MIN },
    ],
  },
  {
    author: named('jaylen'),
    tag: 'venting',
    body: "Burnt out and pretending I'm fine at work. Anyone else running on empty?",
    hugs: 40,
    hearts: 23,
    metoos: 33,
    strengths: 12,
    createdAt: Date.now() - 18 * MIN,
    replies: [
      { id: 'r6', author: anon(), body: 'Running on empty here too. You’re not alone in it.', createdAt: Date.now() - 10 * MIN },
    ],
  },
  {
    author: anon(),
    tag: 'gratitude',
    body: 'A stranger paid for my coffee today and I nearly cried. Small things are keeping me going.',
    hugs: 12,
    hearts: 88,
    createdAt: Date.now() - 60 * MIN,
    replies: [],
  },
  {
    author: named('priya'),
    tag: 'advice',
    body: "How do you tell a friend you need space without hurting them? I love them but I'm drowning.",
    hugs: 6,
    hearts: 14,
    createdAt: Date.now() - 120 * MIN,
    replies: [
      { id: 'r7', author: anon(), body: 'Honesty wrapped in care. “I love you and I need a little quiet” is enough.', createdAt: Date.now() - 90 * MIN },
    ],
  },
  {
    author: anon(),
    tag: 'latenight',
    body: "It's 3am and my brain won't stop rewriting conversations from years ago. Anyone up?",
    hugs: 29,
    hearts: 9,
    createdAt: Date.now() - 180 * MIN,
    replies: [],
  },
  {
    author: named('noor'),
    tag: 'wins',
    body: 'Six months sober today. Told no one in my life yet, so I’m telling you first. 🕯️',
    hugs: 21,
    hearts: 140,
    candles: 25,
    strengths: 60,
    createdAt: Date.now() - 300 * MIN,
    replies: [
      { id: 'r8', author: anon(), body: 'Six months is enormous. Thank you for trusting us with it.', createdAt: Date.now() - 240 * MIN },
    ],
  },
];

/** Empty who-reacted arrays for every reaction, so a fresh post has all fields present. */
const emptyReactionBy = (): Record<string, string[]> =>
  Object.fromEntries(REACTIONS.map((r) => [r.byField, [] as string[]]));

/** Write the demo posts once, owned by the seeding user but flagged so they never show as "mine". */
async function seedPosts(uid: string) {
  const batch = writeBatch(db);
  for (const seed of SEED_POSTS) {
    const ref = doc(collection(db, 'posts'));
    batch.set(ref, { ...emptyReactionBy(), ...seed, authorUid: uid, seeded: true });
  }
  await batch.commit();
}

// Coerce dynamically-read reaction fields (typed `unknown` via the index signature).
const asArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const asNum = (v: unknown): number => (typeof v === 'number' ? v : 0);

/** Count per reaction for a reply, derived from its who-reacted lists. */
const replyReactionCounts = (reactBy?: Partial<Record<ReactionId, string[]>>): Record<ReactionId, number> =>
  Object.fromEntries(REACTIONS.map((r) => [r.id, (reactBy?.[r.id] ?? []).length])) as Record<ReactionId, number>;

/** Which reactions the current user has left on a reply. */
const replyMyReactions = (
  reactBy: Partial<Record<ReactionId, string[]>> | undefined,
  uid?: string
): Record<ReactionId, boolean> =>
  Object.fromEntries(
    REACTIONS.map((r) => [r.id, !!uid && (reactBy?.[r.id] ?? []).includes(uid)])
  ) as Record<ReactionId, boolean>;

type NewPostInput = { body: string; tag: TagId; identity: Identity };

type PostsContextType = {
  posts: Post[];
  communities: Community[];
  /** True until the first batch of posts arrives — drives the feed skeletons. */
  loading: boolean;
  /** Re-pull the feed from the server; resolves once a fresh snapshot lands. */
  refresh: () => Promise<void>;
  activeTag: TagId;
  setActiveTag: (tag: TagId) => void;
  /** Whether the feed is showing the personalized "For you" view. */
  forYou: boolean;
  setForYou: (on: boolean) => void;
  getPost: (id: string) => Post | undefined;
  postsByTag: (tag: TagId) => Post[];
  /** Named posts from the people you follow (newest first). */
  forYouPosts: () => Post[];
  /** Follow / unfollow a named author by handle, and check follow state. */
  isFollowing: (handle: string) => boolean;
  followAuthor: (handle: string) => void;
  unfollowAuthor: (handle: string) => void;
  myPosts: () => Post[];
  savedPosts: () => Post[];
  /** Add/remove one of the warmth reactions on a post. */
  toggleReaction: (id: string, reaction: ReactionId) => void;
  /** Add/remove a warmth reaction on a reply. */
  toggleReplyReaction: (postId: string, replyId: string, reaction: ReactionId) => void;
  toggleSave: (id: string) => void;
  addReply: (postId: string, body: string, identity: Identity) => void;
  addPost: (input: NewPostInput) => Promise<void>;
  /** Delete one of your own posts (owner-only, enforced by Firestore rules). */
  deletePost: (id: string) => void;
  /** People the current user has blocked. */
  blocked: BlockedUser[];
  /** Hide everything from a person (their posts + replies vanish from your view). */
  blockAuthor: (uid: string, name: string) => void;
  /** Undo a block (from Profile → Blocked people). */
  unblockAuthor: (uid: string) => void;
  /** Report a post for review; also hides it from your own feed. */
  reportPost: (postId: string, reason: ReportReasonId) => void;
  /** Report a reply for review. */
  reportReply: (postId: string, replyId: string, reason: ReportReasonId) => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [rawPosts, setRawPosts] = useState<StoredPost[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [communityDeltas, setCommunityDeltas] = useState<Record<string, number>>({});
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [followingHandles, setFollowingHandles] = useState<Set<string>>(new Set());
  const [activeTag, setActiveTagState] = useState<TagId>('venting');
  const [forYou, setForYou] = useState(false);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  // Pull-to-refresh re-subscribes the feed (bumping this nonce) and resolves the
  // returned promise once the fresh server snapshot arrives.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const refreshResolve = useRef<(() => void) | null>(null);
  const refresh = () =>
    new Promise<void>((resolve) => {
      refreshResolve.current = resolve;
      setRefreshNonce((n) => n + 1);
    });

  // Selecting a community tag always leaves the "For you" view.
  const setActiveTag = (tag: TagId) => {
    setActiveTagState(tag);
    setForYou(false);
  };

  // Resolve any in-flight pull-to-refresh, and stop showing skeletons.
  const settle = () => {
    setLoading(false);
    refreshResolve.current?.();
    refreshResolve.current = null;
  };

  // Live feed. Only subscribe when signed in (reads require auth). Re-runs on
  // `refreshNonce` so pull-to-refresh forces a fresh server round-trip.
  useEffect(() => {
    if (!uid) {
      setRawPosts([]);
      settle();
      return;
    }
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRawPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StoredPost, 'id'>) })));
        // Skeletons clear on the first delivery; a pull-to-refresh only settles
        // once the authoritative server snapshot (not the cache) comes back.
        if (!snap.metadata.fromCache) settle();
        else setLoading(false);
        // Seed once, only against a confirmed-empty (server, not cached) collection.
        if (!snap.metadata.fromCache && snap.empty && !seededRef.current) {
          seededRef.current = true;
          seedPosts(uid).catch((e) => console.warn('Failed to seed posts:', e));
        }
      },
      (error) => {
        console.warn('Posts listener error:', error);
        settle();
      }
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, refreshNonce]);

  // Live membership deltas per community. Each `communities/{tag}` doc holds a
  // net joins-minus-leaves count layered on top of the seeded baseline in
  // COMMUNITIES, so the displayed number moves as people join and leave.
  useEffect(() => {
    if (!uid) {
      setCommunityDeltas({});
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, 'communities'),
      (snap) => {
        const next: Record<string, number> = {};
        snap.docs.forEach((d) => {
          next[d.id] = (d.data() as { members?: number }).members ?? 0;
        });
        setCommunityDeltas(next);
      },
      (error) => console.warn('Communities listener error:', error)
    );
    return unsubscribe;
  }, [uid]);

  // The current user's saved-post ids (private subcollection).
  useEffect(() => {
    if (!uid) {
      setSavedIds(new Set());
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, 'users', uid, 'saved'),
      (snap) => setSavedIds(new Set(snap.docs.map((d) => d.id))),
      (error) => console.warn('Saved listener error:', error)
    );
    return unsubscribe;
  }, [uid]);

  // The current user's moderation state: blocked people + hidden posts (both
  // private subcollections). Blocked authors and hidden posts are filtered out
  // of everything the user sees.
  useEffect(() => {
    if (!uid) {
      setBlocked([]);
      setHiddenPostIds(new Set());
      setFollowingHandles(new Set());
      return;
    }
    const unsubFollowing = onSnapshot(
      collection(db, 'users', uid, 'following'),
      (snap) => setFollowingHandles(new Set(snap.docs.map((d) => d.id))),
      (error) => console.warn('Following listener error:', error)
    );
    const unsubBlocked = onSnapshot(
      collection(db, 'users', uid, 'blocked'),
      (snap) =>
        setBlocked(
          snap.docs
            .map((d) => ({ uid: d.id, ...(d.data() as Omit<BlockedUser, 'uid'>) }))
            .sort((a, b) => b.blockedAt - a.blockedAt)
        ),
      (error) => console.warn('Blocked listener error:', error)
    );
    const unsubHidden = onSnapshot(
      collection(db, 'users', uid, 'hidden'),
      (snap) => setHiddenPostIds(new Set(snap.docs.map((d) => d.id))),
      (error) => console.warn('Hidden listener error:', error)
    );
    return () => {
      unsubFollowing();
      unsubBlocked();
      unsubHidden();
    };
  }, [uid]);

  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.uid)), [blocked]);

  // Map stored docs → the display `Post` shape (derives per-user state).
  // Posts you've hidden or whose author you've blocked are dropped entirely, and
  // replies from blocked authors are filtered out of the posts that remain.
  const posts = useMemo<Post[]>(
    () =>
      rawPosts
        .filter((r) => !hiddenPostIds.has(r.id) && !(r.authorUid && blockedSet.has(r.authorUid)))
        .map((r) => ({
          id: r.id,
          author: r.author,
          authorUid: r.authorUid ?? undefined,
          tag: r.tag,
          body: r.body,
          reactions: Object.fromEntries(
            REACTIONS.map((rx) => [rx.id, asNum(field(r, rx.countField))])
          ) as Record<ReactionId, number>,
          myReactions: Object.fromEntries(
            REACTIONS.map((rx) => [rx.id, !!uid && asArr(field(r, rx.byField)).includes(uid)])
          ) as Record<ReactionId, boolean>,
          replies: (r.replies ?? [])
            .filter((rp) => !(rp.authorUid && blockedSet.has(rp.authorUid)))
            .map((rp) => ({
              id: rp.id,
              author: rp.author,
              authorUid: rp.authorUid,
              body: rp.body,
              createdAt: timeAgo(rp.createdAt),
              reactions: replyReactionCounts(rp.reactBy),
              myReactions: replyMyReactions(rp.reactBy, uid),
            })),
          createdAt: timeAgo(r.createdAt),
          mine: !!uid && r.authorUid === uid && !r.seeded,
          saved: savedIds.has(r.id),
        })),
    [rawPosts, savedIds, uid, hiddenPostIds, blockedSet]
  );

  // Communities with live counts (baseline + membership delta, never negative).
  const communities = useMemo<Community[]>(
    () => COMMUNITIES.map((c) => ({ ...c, count: Math.max(0, c.count + (communityDeltas[c.tag] ?? 0)) })),
    [communityDeltas]
  );

  const getPost = (id: string) => posts.find((p) => p.id === id);
  const postsByTag = (tag: TagId) => posts.filter((p) => p.tag === tag);
  const myPosts = () => posts.filter((p) => p.mine);
  const savedPosts = () => posts.filter((p) => p.saved);

  // The "For you" feed: only *named* posts from people you follow, so following
  // someone never de-anonymizes the posts they chose to share anonymously.
  const forYouPosts = () =>
    posts.filter((p) => p.author.mode === 'named' && p.author.handle && followingHandles.has(p.author.handle));

  const isFollowing = (handle: string) => followingHandles.has(handle);

  const followAuthor = (handle: string) => {
    if (!uid || !handle) return;
    setDoc(doc(db, 'users', uid, 'following', handle), { followedAt: Date.now() }).catch((e) =>
      console.warn('Failed to follow:', e)
    );
  };

  const unfollowAuthor = (handle: string) => {
    if (!uid || !handle) return;
    deleteDoc(doc(db, 'users', uid, 'following', handle)).catch((e) =>
      console.warn('Failed to unfollow:', e)
    );
  };

  const toggleReaction = (id: string, reaction: ReactionId) => {
    if (!uid) return;
    const def = reactionById(reaction);
    const raw = rawPosts.find((p) => p.id === id);
    if (!def || !raw) return;
    const on = !asArr(field(raw, def.byField)).includes(uid);
    updateDoc(doc(db, 'posts', id), {
      [def.byField]: on ? arrayUnion(uid) : arrayRemove(uid),
      [def.countField]: increment(on ? 1 : -1),
    }).catch((e) => console.warn('Failed to toggle reaction:', e));
    // Warm the author only when a reaction is added (not when it's taken back).
    // Reactions stay anonymous, matching how they appear on the post itself.
    if (on) {
      notify({
        recipientUid: raw.authorUid,
        actorUid: uid,
        type: reaction,
        actor: { mode: 'anonymous' },
        postId: id,
        postBody: raw.body,
        tag: raw.tag,
      });
    }
  };

  // React to a reply. Replies live inside the post's `replies` array, so this is
  // a read-modify-write of the whole array (no arrayUnion on a nested element).
  const toggleReplyReaction = (postId: string, replyId: string, reaction: ReactionId) => {
    if (!uid) return;
    const raw = rawPosts.find((p) => p.id === postId);
    if (!raw) return;
    const replies = (raw.replies ?? []).map((rp) => {
      if (rp.id !== replyId) return rp;
      const reactBy = { ...(rp.reactBy ?? {}) };
      const list = reactBy[reaction] ?? [];
      reactBy[reaction] = list.includes(uid) ? list.filter((u) => u !== uid) : [...list, uid];
      return { ...rp, reactBy };
    });
    updateDoc(doc(db, 'posts', postId), { replies }).catch((e) =>
      console.warn('Failed to toggle reply reaction:', e)
    );
  };

  const toggleSave = (id: string) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'saved', id);
    const op = savedIds.has(id) ? deleteDoc(ref) : setDoc(ref, { savedAt: Date.now() });
    op.catch((e) => console.warn('Failed to toggle save:', e));
  };

  const addReply = (postId: string, body: string, identity: Identity) => {
    if (!uid) return;
    const raw = rawPosts.find((p) => p.id === postId);
    const author = cleanIdentity(identity);
    const reply: StoredReply = {
      id: `r_${Date.now()}`,
      author,
      authorUid: uid,
      body,
      createdAt: Date.now(),
    };
    updateDoc(doc(db, 'posts', postId), { replies: arrayUnion(reply) }).catch((e) =>
      console.warn('Failed to add reply:', e)
    );
    if (raw) {
      notify({
        recipientUid: raw.authorUid,
        actorUid: uid,
        type: 'reply',
        actor: author,
        postId,
        postBody: raw.body,
        tag: raw.tag,
        replyBody: body,
      });
    }
  };

  // Delete a post. The live listener drops it from local state automatically;
  // Firestore rules reject the write unless you're the author.
  const deletePost = (id: string) => {
    if (!uid) return;
    deleteDoc(doc(db, 'posts', id)).catch((e) => console.warn('Failed to delete post:', e));
  };

  // --- Moderation: block a person, and report content for review ---

  const blockAuthor = (blockedUid: string, name: string) => {
    if (!uid || blockedUid === uid) return;
    setDoc(doc(db, 'users', uid, 'blocked', blockedUid), { name, blockedAt: Date.now() }).catch((e) =>
      console.warn('Failed to block author:', e)
    );
  };

  const unblockAuthor = (blockedUid: string) => {
    if (!uid) return;
    deleteDoc(doc(db, 'users', uid, 'blocked', blockedUid)).catch((e) =>
      console.warn('Failed to unblock author:', e)
    );
  };

  const hidePost = (postId: string) => {
    if (!uid) return;
    setDoc(doc(db, 'users', uid, 'hidden', postId), { hiddenAt: Date.now() }).catch((e) =>
      console.warn('Failed to hide post:', e)
    );
  };

  // Reporting a post files it for review and hides it from the reporter right
  // away — you shouldn't have to keep looking at something you just flagged.
  const reportPost = (postId: string, reason: ReportReasonId) => {
    if (!uid) return;
    const raw = rawPosts.find((p) => p.id === postId);
    reportContent({ targetType: 'post', postId, reportedUid: raw?.authorUid ?? null, reason, reporterUid: uid });
    hidePost(postId);
  };

  const reportReply = (postId: string, replyId: string, reason: ReportReasonId) => {
    if (!uid) return;
    const raw = rawPosts.find((p) => p.id === postId);
    const reply = (raw?.replies ?? []).find((r) => r.id === replyId);
    reportContent({
      targetType: 'reply',
      postId,
      replyId,
      reportedUid: reply?.authorUid ?? null,
      reason,
      reporterUid: uid,
    });
  };

  const addPost = async ({ body, tag, identity }: NewPostInput) => {
    if (!uid) return;
    const post: Omit<StoredPost, 'id'> = {
      authorUid: uid,
      author: cleanIdentity(identity),
      tag,
      body,
      hugs: 0,
      hearts: 0,
      hugBy: [],
      heartBy: [],
      replies: [],
      createdAt: Date.now(),
    };
    try {
      await addDoc(collection(db, 'posts'), post);
    } catch (e) {
      console.warn('Failed to add post:', e);
    }
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        communities,
        loading,
        refresh,
        activeTag,
        setActiveTag,
        forYou,
        setForYou,
        getPost,
        postsByTag,
        forYouPosts,
        isFollowing,
        followAuthor,
        unfollowAuthor,
        myPosts,
        savedPosts,
        toggleReaction,
        toggleReplyReaction,
        toggleSave,
        addReply,
        addPost,
        deletePost,
        blocked,
        blockAuthor,
        unblockAuthor,
        reportPost,
        reportReply,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within a PostsProvider');
  return context;
};
