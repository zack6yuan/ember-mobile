import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getGoogleIdToken, googleSignOut } from '@/lib/googleSignIn';
import { suggestHandle } from '@/lib/handle';

type AuthContextType = {
  /** The signed-in Firebase user, or null when logged out. */
  user: User | null;
  /** True until the first auth state is known (avoids a login/feed flash). */
  initializing: boolean;
  signUp: (email: string, password: string, handle: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  /**
   * Native Google sign-in (issue #1). Resolves to the Firebase user plus whether
   * this is their first sign-in — the caller provisions a profile for new users
   * (see login/signup screens). Only available in a custom dev build; guarded by
   * `isGoogleSignInAvailable()` at the call sites.
   */
  signInWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
  signOut: () => Promise<void>;
  /** Send a password-reset email via Firebase. */
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Turn Firebase's error codes into copy that fits Ember's gentle voice. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email doesn’t look quite right.';
    case 'auth/weak-password':
      return 'Passwords need at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match. Give it another try.';
    case 'auth/account-exists-with-different-credential':
      return 'You already have an account with this email. Sign in the way you did before.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Take a breath and try again in a moment.';
    case 'auth/network-request-failed':
      return 'We couldn’t reach the network. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, handle: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: handle });
    return credential.user;
  };

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  };

  const signInWithGoogle = async () => {
    // Native Google sheet → Firebase credential exchange.
    const idToken = await getGoogleIdToken();
    const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
    // First-time Google users never typed a username. Seed the Auth displayName
    // with a valid handle now so the profile handle is consistent no matter
    // which path writes it first (createProfile in the screen, or UserContext's
    // self-heal fallback, which derives the handle from displayName).
    if (isNewUser) {
      const seed = result.user.displayName || result.user.email?.split('@')[0] || 'friend';
      await updateProfile(result.user, { displayName: suggestHandle(seed) });
    }
    return { user: result.user, isNewUser };
  };

  const signOut = async () => {
    // Clear the native Google session too, so its account picker reappears next
    // time; best-effort, Firebase sign-out below is authoritative.
    await googleSignOut();
    await fbSignOut(auth);
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

  return (
    <AuthContext.Provider
      value={{ user, initializing, signUp, signIn, signInWithGoogle, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
