import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserProfile = {
  name: string;
  username: string;
  bio: string;
  location: string;
  avatarInitial: string;
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Code Blue Veteran',
  username: 'CodeBlueVeteran',
  bio: 'Registered Nurse | ER | Coffee Addict',
  location: '',
  avatarInitial: 'C',
};

const USER_DOC_PATH = 'users/default';

type UserContextType = {
  userProfile: UserProfile;
  updateProfile: (fields: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const docRef = doc(db, USER_DOC_PATH);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<UserProfile>;
        setUserProfile({
          name: data.name || DEFAULT_PROFILE.name,
          username: data.username || DEFAULT_PROFILE.username,
          bio: data.bio || DEFAULT_PROFILE.bio,
          location: data.location || DEFAULT_PROFILE.location,
          avatarInitial: data.avatarInitial || (data.username?.charAt(0).toUpperCase() ?? DEFAULT_PROFILE.avatarInitial),
        });
      } else {
        // First load — seed Firestore with defaults
        await setDoc(docRef, DEFAULT_PROFILE);
      }
    } catch (error) {
      console.warn('Failed to load profile from Firestore, using defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (fields: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...fields };

    // Auto-derive avatar initial from first character of username
    if (fields.username) {
      updated.avatarInitial = fields.username.charAt(0).toUpperCase();
    }

    setUserProfile(updated);

    try {
      const docRef = doc(db, USER_DOC_PATH);
      await setDoc(docRef, updated, { merge: true });
    } catch (error) {
      console.error('Failed to save profile to Firestore:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, updateProfile, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
