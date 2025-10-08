// components/auth/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

interface UserWithRole {
  uid: string;
  email: string | null;
  role: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      let role = "student"; // default
      const parentSnap = await getDoc(doc(db, "parents", firebaseUser.uid));
      const teacherSnap = await getDoc(doc(db, "teachers", firebaseUser.uid));
      const adminSnap = await getDoc(doc(db, "admins", firebaseUser.uid));
      const principalSnap = await getDoc(doc(db, "principals", firebaseUser.uid));

      if (adminSnap.exists()) role = "admin";
      else if (principalSnap.exists()) role = "principal";
      else if (teacherSnap.exists()) role = "teacher";
      else if (parentSnap.exists()) role = "parent";

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role,
      });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
