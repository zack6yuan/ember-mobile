import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Identity, IdentityMode } from '@/store/PostsContext';

/**
 * The signed-in person. In Ember every post can be shared anonymously or under a
 * username — this store holds the account handle plus the *default* identity mode
 * chosen during onboarding (overridable on any post).
 */
export type Session = {
  handle: string; // account username, e.g. "mia_r"
  defaultMode: IdentityMode; // default from onboarding
  memberSince: string; // display string, e.g. "March"
  embersShared: number;
};

const DEFAULT_SESSION: Session = {
  handle: 'mia_r',
  defaultMode: 'anonymous',
  memberSince: 'March',
  embersShared: 41,
};

const SESSION_DOC_PATH = 'sessions/default';

type UserContextType = {
  session: Session;
  /** The identity to pre-select when composing, derived from the default mode. */
  defaultIdentity: Identity;
  /** Build a named identity for this account (used by the segmented control). */
  namedIdentity: Identity;
  anonIdentity: Identity;
  setDefaultMode: (mode: IdentityMode) => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const ref = doc(db, SESSION_DOC_PATH);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<Session>;
        setSession({
          handle: data.handle || DEFAULT_SESSION.handle,
          defaultMode: data.defaultMode || DEFAULT_SESSION.defaultMode,
          memberSince: data.memberSince || DEFAULT_SESSION.memberSince,
          embersShared: data.embersShared ?? DEFAULT_SESSION.embersShared,
        });
      } else {
        await setDoc(ref, DEFAULT_SESSION);
      }
    } catch (error) {
      console.warn('Failed to load session from Firestore, using defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultMode = async (mode: IdentityMode) => {
    const updated = { ...session, defaultMode: mode };
    setSession(updated);
    try {
      await setDoc(doc(db, SESSION_DOC_PATH), updated, { merge: true });
    } catch (error) {
      console.warn('Failed to persist default identity:', error);
    }
  };

  const anonIdentity: Identity = { mode: 'anonymous' };
  const namedIdentity: Identity = { mode: 'named', handle: session.handle };
  const defaultIdentity: Identity = session.defaultMode === 'named' ? namedIdentity : anonIdentity;

  return (
    <UserContext.Provider
      value={{ session, defaultIdentity, namedIdentity, anonIdentity, setDefaultMode, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
