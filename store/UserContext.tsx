import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/store/AuthContext';
import type { Identity, IdentityMode } from '@/store/PostsContext';

/**
 * The signed-in person's Ember profile, stored at `users/{uid}` in Firestore.
 * In Ember every post can be shared anonymously or under a username — this store
 * holds the account handle plus the *default* identity mode chosen during
 * onboarding (overridable on any post).
 */
export type Session = {
  uid: string; // Firebase Auth uid this profile belongs to
  handle: string; // account username, e.g. "mia_r"
  defaultMode: IdentityMode; // default from onboarding
  memberSince: string; // display string, e.g. "March"
  embersShared: number;
  onboarded: boolean; // has the person finished the identity onboarding step
};

/** The month name shown as "Here since …" for a new account. */
function currentMonth(): string {
  return new Date().toLocaleString('en-US', { month: 'long' });
}

function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

/** A fresh, un-onboarded profile for a brand-new (or not-yet-provisioned) account. */
function defaultProfile(uid: string, handle: string | null | undefined): Session {
  return {
    uid,
    handle: handle || 'friend',
    defaultMode: 'anonymous',
    memberSince: currentMonth(),
    embersShared: 0,
    onboarded: false,
  };
}

type UserContextType = {
  session: Session | null;
  /** The identity to pre-select when composing, derived from the default mode. */
  defaultIdentity: Identity;
  /** Build a named identity for this account (used by the segmented control). */
  namedIdentity: Identity;
  anonIdentity: Identity;
  /** Create the Firestore profile for a brand-new account (called from signup). */
  createProfile: (uid: string, handle: string) => Promise<void>;
  /** Persist the chosen default identity mode and mark onboarding complete. */
  finishOnboarding: (mode: IdentityMode) => Promise<void>;
  setDefaultMode: (mode: IdentityMode) => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    const uid = user.uid;
    setIsLoading(true);

    (async () => {
      try {
        const snapshot = await getDoc(userDocRef(uid));
        if (cancelled) return;
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<Session>;
          setSession({
            uid,
            handle: data.handle || user.displayName || 'friend',
            defaultMode: data.defaultMode || 'anonymous',
            memberSince: data.memberSince || currentMonth(),
            embersShared: data.embersShared ?? 0,
            onboarded: data.onboarded ?? false,
          });
        } else {
          // No profile doc — self-heal so an authenticated user always has a
          // session. Covers the signup race, accounts created outside the app,
          // and signups whose profile write failed. Safe to persist: there is
          // no existing data to clobber. (During signup, createProfile may have
          // already set the session for this uid — keep it if so.)
          const fresh = defaultProfile(uid, user.displayName);
          setSession((prev) => (prev?.uid === uid ? prev : fresh));
          setDoc(userDocRef(uid), fresh, { merge: true }).catch((e) =>
            console.warn('Failed to create default profile:', e)
          );
        }
      } catch (error) {
        // Transient read failure — never block the app on the splash screen and
        // never overwrite the remote profile. Use an ephemeral local session
        // (assume a returning, onboarded user to avoid a spurious re-onboarding)
        // that refreshes on the next successful load.
        if (!cancelled) {
          console.warn('Failed to load profile from Firestore:', error);
          setSession((prev) =>
            prev?.uid === uid ? prev : { ...defaultProfile(uid, user.displayName), onboarded: true }
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = async (next: Session) => {
    setSession(next);
    try {
      await setDoc(userDocRef(next.uid), next, { merge: true });
    } catch (error) {
      console.warn('Failed to persist profile:', error);
    }
  };

  const createProfile = async (uid: string, handle: string) => {
    await persist(defaultProfile(uid, handle));
  };

  const finishOnboarding = async (mode: IdentityMode) => {
    if (!session) return;
    await persist({ ...session, defaultMode: mode, onboarded: true });
  };

  const setDefaultMode = async (mode: IdentityMode) => {
    if (!session) return;
    await persist({ ...session, defaultMode: mode });
  };

  const anonIdentity: Identity = { mode: 'anonymous' };
  const namedIdentity: Identity = { mode: 'named', handle: session?.handle };
  const defaultIdentity: Identity =
    session?.defaultMode === 'named' ? namedIdentity : anonIdentity;

  return (
    <UserContext.Provider
      value={{
        session,
        defaultIdentity,
        namedIdentity,
        anonIdentity,
        createProfile,
        finishOnboarding,
        setDefaultMode,
        isLoading,
      }}
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
