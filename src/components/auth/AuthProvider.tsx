// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextProps {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: any) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ---------------- Watch Firebase Auth ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = firebaseUser.uid;
      let userData: any = null;

      // Try to find a Firestore profile in any role collection
      const roles = ['admins', 'teachers', 'students', 'parents'];
      for (const collection of roles) {
        const ref = doc(db, collection, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          userData = { ...firebaseUser, ...snap.data() };
          break;
        }
      }

      // 🚀 Bootstrap: if no role doc exists, auto-create as Admin
      if (!userData) {
        console.warn("No profile found for user → creating admin doc automatically");
        const ref = doc(db, 'admins', uid);
        await setDoc(ref, {
          uid,
          email: firebaseUser.email,
          role: 'admin',
          name: firebaseUser.displayName || 'Admin',
          approved: true,
          createdAt: new Date().toISOString()
        });
        userData = { ...firebaseUser, role: 'admin' };
      }

      setUser(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- Auth Functions ----------------
  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signup = async (data: any) => {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    // Only parents self-register
    await setDoc(doc(db, 'parents', cred.user.uid), {
      uid: cred.user.uid,
      email: data.email,
      role: 'parent',
      name: data.name,
      childName: data.childName,
      childGrade: data.childGrade,
      createdAt: new Date().toISOString()
    });
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  };

  const logout = async () => auth.signOut();

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
