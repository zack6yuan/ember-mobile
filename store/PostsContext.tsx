import React, { createContext, useContext, useState } from 'react';

export type IdentityMode = 'anonymous' | 'named';
export type Identity = { mode: IdentityMode; handle?: string };

export type TagId = 'venting' | 'wins' | 'advice' | 'gratitude' | 'latenight';

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
];

export const TAG_ORDER: TagId[] = ['venting', 'wins', 'advice', 'gratitude', 'latenight'];

const anon = (): Identity => ({ mode: 'anonymous' });
const named = (handle: string): Identity => ({ mode: 'named', handle });

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: anon(),
    tag: 'venting',
    body: "Third night I can't sleep. Feels like everyone moved on with their lives and I'm just… stuck.",
    hugs: 34,
    hearts: 12,
    createdAt: '4m',
    mine: true, // the current user posted this anonymously (visible in their profile)
    replies: [
      { id: 'r1', author: anon(), body: 'Stuck is still a place you can leave. Been there. It gets lighter.', createdAt: '2m' },
      { id: 'r2', author: named('leo'), body: "Sitting with you tonight. You're not as behind as it feels. 🕯️", createdAt: '1m' },
      { id: 'r3', author: anon(), body: 'The 3am hours lie to you. Morning always has a different opinion.', createdAt: '1m' },
    ],
  },
  {
    id: '2',
    author: named('mia_r'),
    tag: 'wins',
    body: "Finally sent the email I'd been dreading for a month. Hands were shaking but I did it 🎉",
    hugs: 8,
    hearts: 51,
    createdAt: '20m',
    mine: true,
    replies: [
      { id: 'r4', author: anon(), body: 'That first send is the hardest part. Proud of you.', createdAt: '12m' },
      { id: 'r5', author: named('sam'), body: 'Shaking hands still hit send. That’s courage. 🎉', createdAt: '8m' },
    ],
  },
  {
    id: '3',
    author: named('jaylen'),
    tag: 'venting',
    body: "Burnt out and pretending I'm fine at work. Anyone else running on empty?",
    hugs: 40,
    hearts: 23,
    createdAt: '18m',
    replies: [
      { id: 'r6', author: anon(), body: 'Running on empty here too. You’re not alone in it.', createdAt: '10m' },
    ],
  },
  {
    id: '4',
    author: anon(),
    tag: 'gratitude',
    body: 'A stranger paid for my coffee today and I nearly cried. Small things are keeping me going.',
    hugs: 12,
    hearts: 88,
    createdAt: '1h',
    replies: [],
  },
  {
    id: '5',
    author: named('priya'),
    tag: 'advice',
    body: "How do you tell a friend you need space without hurting them? I love them but I'm drowning.",
    hugs: 6,
    hearts: 14,
    createdAt: '2h',
    replies: [
      { id: 'r7', author: anon(), body: 'Honesty wrapped in care. “I love you and I need a little quiet” is enough.', createdAt: '1h' },
    ],
  },
  {
    id: '6',
    author: anon(),
    tag: 'latenight',
    body: "It's 3am and my brain won't stop rewriting conversations from years ago. Anyone up?",
    hugs: 29,
    hearts: 9,
    createdAt: '3h',
    replies: [],
  },
  {
    id: '7',
    author: named('noor'),
    tag: 'wins',
    body: 'Six months sober today. Told no one in my life yet, so I’m telling you first. 🕯️',
    hugs: 21,
    hearts: 140,
    createdAt: '5h',
    replies: [
      { id: 'r8', author: anon(), body: 'Six months is enormous. Thank you for trusting us with it.', createdAt: '4h' },
    ],
  },
];

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
  addPost: (input: NewPostInput) => string;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeTag, setActiveTag] = useState<TagId>('venting');

  const getPost = (id: string) => posts.find((p) => p.id === id);
  const postsByTag = (tag: TagId) => posts.filter((p) => p.tag === tag);
  const myPosts = () => posts.filter((p) => p.mine);
  const savedPosts = () => posts.filter((p) => p.saved);

  const toggleHug = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const on = !p.myHug;
        return { ...p, myHug: on, hugs: p.hugs + (on ? 1 : -1) };
      })
    );
  };

  const toggleHeart = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const on = !p.myHeart;
        return { ...p, myHeart: on, hearts: p.hearts + (on ? 1 : -1) };
      })
    );
  };

  const toggleSave = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  };

  const addReply = (postId: string, body: string, identity: Identity) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                { id: `r_${Date.now()}`, author: identity, body, createdAt: 'now' },
              ],
            }
          : p
      )
    );
  };

  const addPost = ({ body, tag, identity }: NewPostInput) => {
    const id = `p_${Date.now()}`;
    const post: Post = {
      id,
      author: identity,
      tag,
      body,
      hugs: 0,
      hearts: 0,
      replies: [],
      createdAt: 'now',
      mine: true,
    };
    setPosts((prev) => [post, ...prev]);
    return id;
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        communities: COMMUNITIES,
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
