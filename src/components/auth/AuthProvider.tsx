"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AppUser {
  uid: string;
  email: string | null;
  role: string;
  status?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 🔹 detect role from Firestore
        let role = "student";
        let status = "active";

        try {
          const teacherSnap = await getDoc(doc(db, "teachers", firebaseUser.uid));
          const principalSnap = await getDoc(doc(db, "principals", firebaseUser.uid));
          const parentSnap = await getDoc(doc(db, "parents", firebaseUser.uid));

          if (teacherSnap.exists()) {
            role = "teacher";
            status = teacherSnap.data().status || "pending_review";
          } else if (principalSnap.exists()) {
            role = "principal";
          } else if (parentSnap.exists()) {
            role = "parent";
            status = parentSnap.data().status || "pending_registration";
          }
        } catch (err) {
          console.error("Error fetching role:", err);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role,
          status,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then((cred) => cred.user);

  const loginWithGoogle = async () => {
    // 👉 you can implement Google login later
    return null;
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
