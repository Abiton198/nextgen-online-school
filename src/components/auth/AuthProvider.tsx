// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  reauthenticateWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'teacher' | 'student' | 'parent' | 'admin';

interface AuthContextProps {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: any) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithGoogleClassroom: (role: Role) => Promise<{ user: User; accessToken: string | null }>;
  linkClassroomScopes: (user: User, role: Role) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

// ---------------- Helper: build provider with scopes ----------------
function buildClassroomProvider(role: Role) {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');

  if (role === 'teacher') {
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
  }
  if (role === 'student') {
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.me.readonly');
  }

  return provider;
}

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

  // Standard Google login (no extra scopes)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  };

  // Google login with Classroom scopes
  const loginWithGoogleClassroom = async (role: Role) => {
    const provider = buildClassroomProvider(role);
    const res = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(res);
    const accessToken = cred?.accessToken || null;
    return { user: res.user, accessToken };
  };

  // Link/reauth existing Google user with Classroom scopes
  const linkClassroomScopes = async (user: User, role: Role) => {
    const provider = buildClassroomProvider(role);
    try {
      const res = await linkWithPopup(user, provider);
      const cred = GoogleAuthProvider.credentialFromResult(res);
      return cred?.accessToken || null;
    } catch (e: any) {
      if (
        e?.code === 'auth/credential-already-in-use' ||
        e?.code === 'auth/requires-recent-login'
      ) {
        const res = await reauthenticateWithPopup(user, provider);
        const cred = GoogleAuthProvider.credentialFromResult(res);
        return cred?.accessToken || null;
      }
      throw e;
    }
  };

  const logout = async () => auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginWithGoogleClassroom,
        linkClassroomScopes,
        logout
      }}
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
