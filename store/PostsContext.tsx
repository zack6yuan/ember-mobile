import React, { createContext, useContext, useState } from 'react';

export type Comment = {
  id: string;
  author: string;
  time: string;
  text: string;
};

export type Post = {
  id: string;
  author: string;
  time: string;
  title: string;
  body: string;
  upvotes: number;
  category: string;
  comments: Comment[];
  voteStatus?: 'none' | 'up' | 'down';
};

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: 'CodeBlueVeteran',
    time: '2h ago',
    title: 'Tips for surviving your first week in the ER?',
    body: 'Just started my orientation in the ER and feeling a bit overwhelmed. What are your best tips for staying organized when you have multiple critical patients?',
    upvotes: 245,
    category: 'question',
    comments: [
      { id: 'c1', author: 'NurseRatched', time: '1h ago', text: 'I totally agree with this!' },
      { id: 'c2', author: 'IV_League', time: '45m ago', text: 'Happens all the time on our floor too. Hang in there!' },
    ],
  },
  {
    id: '2',
    author: 'NightShiftNinja',
    time: '4h ago',
    title: 'Short-staffed again tonight...',
    body: 'We are down two nurses and the unit is completely full. I know we can get through this, but I am so exhausted. Just needed to let that out.',
    upvotes: 412,
    category: 'venting',
    comments: [],
  },
  {
    id: '3',
    author: 'CompassionFatigue',
    time: '6h ago',
    title: 'Lost my first patient today.',
    body: 'I knew it was coming, but it still hit me much harder than I expected. How do you all cope with the grief while still caring for your other patients?',
    upvotes: 890,
    category: 'support',
    comments: [
      { id: 'c3', author: 'TravelRN101', time: '3h ago', text: 'It never gets easy, but you learn to process it. Sending hugs.' }
    ],
  },
  {
    id: '4',
    author: 'StudentNurse99',
    time: '8h ago',
    title: 'Just passed my NCLEX in 75 questions!',
    body: 'I can finally say I am officially a Registered Nurse! After years of studying and clinicals, all the hard work paid off. Thanks everyone for the study guides!',
    upvotes: 1205,
    category: 'success',
    comments: [],
  },
  {
    id: '5',
    author: 'ScrubLife',
    time: '12h ago',
    title: 'When the patient says they have a high pain tolerance...',
    body: '...but cries when you take the tape off their IV. We’ve all been there! 🤣',
    upvotes: 560,
    category: 'humor',
    comments: [],
  },
  {
    id: '6',
    author: 'TravelRN101',
    time: '1d ago',
    title: 'Best scrub brands for 12-hour shifts? 🩺',
    body: 'I am looking for something that is breathable but has at least 5 pockets. Any recommendations?',
    upvotes: 189,
    category: 'question',
    comments: [],
  },
];

type PostsContextType = {
  posts: Post[];
  addComment: (postId: string, text: string) => void;
  setVote: (postId: string, newVoteStatus: 'none' | 'up' | 'down') => void;
  updateAuthorName: (oldName: string, newName: string) => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  const addComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, {
            id: Math.random().toString(),
            author: 'You',
            time: 'Just now',
            text
          }]
        };
      }
      return post;
    }));
  };

  const setVote = (postId: string, newVoteStatus: 'none' | 'up' | 'down') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentStatus = post.voteStatus || 'none';
        if (currentStatus === newVoteStatus) return post;
        
        let diff = 0;
        if (currentStatus === 'up') diff -= 1;
        else if (currentStatus === 'down') diff += 1;
        
        if (newVoteStatus === 'up') diff += 1;
        else if (newVoteStatus === 'down') diff -= 1;
        
        return { ...post, upvotes: post.upvotes + diff, voteStatus: newVoteStatus };
      }
      return post;
    }));
  };

  const updateAuthorName = (oldName: string, newName: string) => {
    if (oldName === newName) return;
    setPosts(prev => prev.map(post => {
      const updatedComments = post.comments.map(c =>
        c.author === oldName ? { ...c, author: newName } : c
      );
      return {
        ...post,
        author: post.author === oldName ? newName : post.author,
        comments: updatedComments,
      };
    }));
  };

  return (
    <PostsContext.Provider value={{ posts, addComment, setVote, updateAuthorName }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error("usePosts must be used within a PostsProvider");
  return context;
};
