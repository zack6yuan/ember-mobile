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
import { notify } from '@/lib/notifications';
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
  body: string;
  createdAt: string; // display string, e.g. "2m"
};

export type Post = {
  id: string;
  author: Identity;
  tag: TagId;
  body: string;
  hugs: number;
  hearts: number;
  replies: Reply[];
  createdAt: string; // display string, e.g. "4m"
  mine?: boolean; // authored by the current user (shown in their profile)
  saved?: boolean;
  myHug?: boolean;
  myHeart?: boolean;
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
type StoredReply = { id: string; author: Identity; body: string; createdAt: number };
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
};

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
    createdAt: Date.now() - 300 * MIN,
    replies: [
      { id: 'r8', author: anon(), body: 'Six months is enormous. Thank you for trusting us with it.', createdAt: Date.now() - 240 * MIN },
    ],
  },
];

/** Write the demo posts once, owned by the seeding user but flagged so they never show as "mine". */
async function seedPosts(uid: string) {
  const batch = writeBatch(db);
  for (const seed of SEED_POSTS) {
    const ref = doc(collection(db, 'posts'));
    batch.set(ref, { ...seed, authorUid: uid, hugBy: [], heartBy: [], seeded: true });
  }
  await batch.commit();
}

type NewPostInput = { body: string; tag: TagId; identity: Identity };

type PostsContextType = {
  posts: Post[];
  communities: Community[];
  activeTag: TagId;
  setActiveTag: (tag: TagId) => void;
  getPost: (id: string) => Post | undefined;
  postsByTag: (tag: TagId) => Post[];
  myPosts: () => Post[];
  savedPosts: () => Post[];
  toggleHug: (id: string) => void;
  toggleHeart: (id: string) => void;
  toggleSave: (id: string) => void;
  addReply: (postId: string, body: string, identity: Identity) => void;
  addPost: (input: NewPostInput) => Promise<void>;
  /** Delete one of your own posts (owner-only, enforced by Firestore rules). */
  deletePost: (id: string) => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [rawPosts, setRawPosts] = useState<StoredPost[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [communityDeltas, setCommunityDeltas] = useState<Record<string, number>>({});
  const [activeTag, setActiveTag] = useState<TagId>('venting');
  const seededRef = useRef(false);

  // Live feed. Only subscribe when signed in (reads require auth).
  useEffect(() => {
    if (!uid) {
      setRawPosts([]);
      return;
    }
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRawPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StoredPost, 'id'>) })));
        // Seed once, only against a confirmed-empty (server, not cached) collection.
        if (!snap.metadata.fromCache && snap.empty && !seededRef.current) {
          seededRef.current = true;
          seedPosts(uid).catch((e) => console.warn('Failed to seed posts:', e));
        }
      },
      (error) => console.warn('Posts listener error:', error)
    );
    return unsubscribe;
  }, [uid]);

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

  // Map stored docs → the display `Post` shape (derives per-user state).
  const posts = useMemo<Post[]>(
    () =>
      rawPosts.map((r) => ({
        id: r.id,
        author: r.author,
        tag: r.tag,
        body: r.body,
        hugs: r.hugs ?? 0,
        hearts: r.hearts ?? 0,
        replies: (r.replies ?? []).map((rp) => ({
          id: rp.id,
          author: rp.author,
          body: rp.body,
          createdAt: timeAgo(rp.createdAt),
        })),
        createdAt: timeAgo(r.createdAt),
        mine: !!uid && r.authorUid === uid && !r.seeded,
        saved: savedIds.has(r.id),
        myHug: !!uid && (r.hugBy ?? []).includes(uid),
        myHeart: !!uid && (r.heartBy ?? []).includes(uid),
      })),
    [rawPosts, savedIds, uid]
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

  const toggleReaction = (id: string, field: 'hug' | 'heart') => {
    if (!uid) return;
    const raw = rawPosts.find((p) => p.id === id);
    if (!raw) return;
    const byField = field === 'hug' ? 'hugBy' : 'heartBy';
    const countField = field === 'hug' ? 'hugs' : 'hearts';
    const on = !(raw[byField] ?? []).includes(uid);
    updateDoc(doc(db, 'posts', id), {
      [byField]: on ? arrayUnion(uid) : arrayRemove(uid),
      [countField]: increment(on ? 1 : -1),
    }).catch((e) => console.warn('Failed to toggle reaction:', e));
    // Warm the author only when a reaction is added (not when it's taken back).
    // Reactions stay anonymous, matching how they appear on the post itself.
    if (on) {
      notify({
        recipientUid: raw.authorUid,
        actorUid: uid,
        type: field,
        actor: { mode: 'anonymous' },
        postId: id,
        postBody: raw.body,
        tag: raw.tag,
      });
    }
  };

  const toggleHug = (id: string) => toggleReaction(id, 'hug');
  const toggleHeart = (id: string) => toggleReaction(id, 'heart');

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
        activeTag,
        setActiveTag,
        getPost,
        postsByTag,
        myPosts,
        savedPosts,
        toggleHug,
        toggleHeart,
        toggleSave,
        addReply,
        addPost,
        deletePost,
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
