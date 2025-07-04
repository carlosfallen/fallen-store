import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // onAuthStateChanged espera (user: User|null) => void
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const logout = () => {
    signOut(auth);
  };

  return { user, login, logout };
};
