'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, signInWithGoogle, signOut } from '@/utils/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  };

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(mapFirebaseUser(firebaseUser));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Clean up listener on unmount
    return unsubscribe;
  }, []);

  const login = async (): Promise<User | null> => {
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        return mapFirebaseUser(firebaseUser);
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 