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
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'teacher' | 'student' | 'parent' | 'admin' | 'unassigned';

interface AuthContextProps {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: any) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithGoogleClassroom: (
    role: Role
  ) => Promise<{ user: User; accessToken: string | null }>;
  linkClassroomScopes: (user: User, role: Role) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

// ---------------- Helper: build Google provider with Classroom scopes ----------------
function buildClassroomProvider(role: Role) {
  const provider = new GoogleAuthProvider();
  // Always allow reading courses
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

      // Try to find a Firestore profile in the correct collection
      const roleCollections = ['admins', 'teachers', 'students', 'parents'];
      for (const collection of roleCollections) {
        const ref = doc(db, collection, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          userData = { ...firebaseUser, ...snap.data() };
          break;
        }
      }

      if (!userData) {
        // No profile anywhere → mark as unassigned (must be approved by admin)
        console.warn('⚠️ No profile found for user, assigning role = unassigned');
        userData = { ...firebaseUser, role: 'unassigned' };
      }

      setUser(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- Auth Functions ----------------

  // Email/password login
  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  // Signup (only parents self-register)
  const signup = async (data: any) => {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // Store in parents collection
    await setDoc(doc(db, 'parents', cred.user.uid), {
      uid: cred.user.uid,
      email: data.email,
      role: 'parent',
      name: data.name,
      childName: data.childName,
      childGrade: data.childGrade,
      createdAt: new Date().toISOString(),
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

  // Logout
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------------- Hook ----------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
