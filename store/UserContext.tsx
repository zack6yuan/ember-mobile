import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { arrayUnion, doc, getDoc, increment, setDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/store/AuthContext';
import { DEFAULT_AVATAR } from '@/constants/avatars';
import type { Identity, IdentityMode, TagId } from '@/store/PostsContext';

/** Circles a brand-new account starts joined to. Everything else is discoverable. */
export const DEFAULT_JOINED: TagId[] = ['venting', 'wins', 'advice'];

/**
 * The signed-in person's Ember profile, stored at `users/{uid}` in Firestore.
 * In Ember every post can be shared anonymously or under a username — this store
 * holds the account handle plus the *default* identity mode chosen during
 * onboarding (overridable on any post).
 */
export type Session = {
  uid: string; // Firebase Auth uid this profile belongs to
  handle: string; // account username, e.g. "mia_r"
  avatar: string; // preset avatar id (see constants/avatars), e.g. "flame"
  avatarUrl: string; // uploaded profile photo download URL; '' when using a preset
  defaultMode: IdentityMode; // default from onboarding
  memberSince: string; // display string, e.g. "March"
  embersShared: number;
  onboarded: boolean; // has the person finished the identity onboarding step
  streak: number; // consecutive days the person has opened the app
  lastCheckIn: string; // local YYYY-MM-DD of the last counted check-in ('' if never)
  longestStreak: number; // best streak reached
  joinedCircles: TagId[]; // communities the person has joined (drives the feed filters)
};

/** The month name shown as "Here since …" for a new account. */
function currentMonth(): string {
  return new Date().toLocaleString('en-US', { month: 'long' });
}

/** Local calendar date as YYYY-MM-DD, offset by whole days (for streak math). */
function localDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

/** A fresh, un-onboarded profile for a brand-new (or not-yet-provisioned) account. */
function defaultProfile(uid: string, handle: string | null | undefined): Session {
  return {
    uid,
    handle: handle || 'friend',
    avatar: DEFAULT_AVATAR,
    avatarUrl: '',
    defaultMode: 'anonymous',
    memberSince: currentMonth(),
    embersShared: 0,
    onboarded: false,
    streak: 0,
    lastCheckIn: '',
    longestStreak: 0,
    joinedCircles: DEFAULT_JOINED,
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
  /** Update editable profile fields (handle, preset avatar, and/or uploaded photo URL). */
  updateProfile: (patch: { handle?: string; avatar?: string; avatarUrl?: string }) => Promise<void>;
  /** Count one more ember shared (called when the person publishes a post). */
  incrementEmbersShared: () => void;
  /** Join a community (tapping an un-joined circle in the feed filters). */
  joinCircle: (tag: TagId) => void;
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
            avatar: data.avatar || DEFAULT_AVATAR,
            avatarUrl: data.avatarUrl || '',
            defaultMode: data.defaultMode || 'anonymous',
            memberSince: data.memberSince || currentMonth(),
            embersShared: data.embersShared ?? 0,
            onboarded: data.onboarded ?? false,
            streak: data.streak ?? 0,
            lastCheckIn: data.lastCheckIn ?? '',
            longestStreak: data.longestStreak ?? 0,
            joinedCircles: data.joinedCircles ?? DEFAULT_JOINED,
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

  // Edit the handle and/or preset avatar. Persists to Firestore and, when the
  // handle changes, keeps the Firebase Auth displayName in sync (it's the
  // fallback used when the profile doc can't be read).
  const updateProfile = async (patch: { handle?: string; avatar?: string; avatarUrl?: string }) => {
    if (!session) return;
    await persist({ ...session, ...patch });
    if (patch.handle && user && patch.handle !== session.handle) {
      updateAuthProfile(user, { displayName: patch.handle }).catch((e) =>
        console.warn('Failed to sync displayName:', e)
      );
    }
  };

  // Bump the shared-post tally: optimistic local update + a server-authoritative
  // increment (merge so it works even if the field was never written).
  const incrementEmbersShared = () => {
    if (!session) return;
    const uid = session.uid;
    setSession((prev) =>
      prev?.uid === uid ? { ...prev, embersShared: prev.embersShared + 1 } : prev
    );
    setDoc(userDocRef(uid), { embersShared: increment(1) }, { merge: true }).catch((e) =>
      console.warn('Failed to increment embersShared:', e)
    );
  };

  // Join a community: optimistic local add + a server-authoritative arrayUnion
  // (idempotent, so re-joining is a no-op both locally and remotely).
  const joinCircle = (tag: TagId) => {
    if (!session || session.joinedCircles.includes(tag)) return;
    const uid = session.uid;
    setSession((prev) =>
      prev?.uid === uid && !prev.joinedCircles.includes(tag)
        ? { ...prev, joinedCircles: [...prev.joinedCircles, tag] }
        : prev
    );
    setDoc(userDocRef(uid), { joinedCircles: arrayUnion(tag) }, { merge: true }).catch((e) =>
      console.warn('Failed to join circle:', e)
    );
  };

  // Daily check-in: once per app launch, bump the streak for a new local day.
  // Consecutive day → +1; a gap → reset to 1; same day → no change.
  const checkedInFor = useRef<string | null>(null);
  useEffect(() => {
    if (!session || checkedInFor.current === session.uid) return;
    checkedInFor.current = session.uid;

    const today = localDateStr();
    if (session.lastCheckIn === today) return;
    const nextStreak = session.lastCheckIn === localDateStr(-1) ? session.streak + 1 : 1;
    persist({
      ...session,
      streak: nextStreak,
      lastCheckIn: today,
      longestStreak: Math.max(session.longestStreak, nextStreak),
    });
    // Runs once when the profile first loads for this uid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.uid]);

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
        updateProfile,
        incrementEmbersShared,
        joinCircle,
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
