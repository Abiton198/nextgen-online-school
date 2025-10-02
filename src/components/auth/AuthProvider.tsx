"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

// --- AppUser merges Firebase user with Firestore profile ---
interface AppUser extends FirebaseUser {
  role?: string;
  status?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  signup: (email: string, password: string) => Promise<FirebaseUser>;
  loginWithGoogle: (extraData?: Record<string, any>) => Promise<FirebaseUser | void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        if (unsubProfile) unsubProfile();
        return;
      }

      const uid = firebaseUser.uid;

      // collections to check in new model
      const roleCollections: { name: string; role: string }[] = [
        { name: "admins", role: "admin" },
        { name: "principals", role: "principal" },
        { name: "registrations", role: "student" },
        { name: "teacherApplications", role: "teacher" },
      ];

      let profileFound = false;

      for (const { name, role } of roleCollections) {
        const ref = doc(db, name, uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          profileFound = true;
          if (unsubProfile) unsubProfile();

          unsubProfile = onSnapshot(ref, (profileSnap) => {
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              setUser({
                ...firebaseUser,
                ...data,
                role: data.role || role,
                status: data.status || "pending_review", // new model defaults
              });
            } else {
              setUser({
                ...firebaseUser,
                role,
                status: "unknown",
              });
            }
            setLoading(false);
          });

          break;
        }
      }

      if (!profileFound) {
        // no profile yet → treat as unassigned
        setUser({
          ...firebaseUser,
          role: "unassigned",
          status: "unknown",
        });
        setLoading(false);
      }
    });

    // Handle Google Redirect after login
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user as AppUser);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // --- Authentication methods ---
  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  };

  const signup = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  };

  const loginWithGoogle = async (extraData: Record<string, any> = {}) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      const uid = gUser.uid;

      // teachers apply here
      const teacherRef = doc(db, "teacherApplications", uid);
      const snap = await getDoc(teacherRef);

      if (snap.exists()) {
        await updateDoc(teacherRef, { ...extraData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(teacherRef, {
          uid,
          email: gUser.email!,
          firstName: gUser.displayName?.split(" ")[0] || "",
          lastName: gUser.displayName?.split(" ")[1] || "",
          ...extraData,
          status: "pending_review",
          createdAt: serverTimestamp(),
        });
      }

      return gUser;
    } catch (error: any) {
      console.warn("Popup login failed, falling back to redirect:", error);
      await signInWithRedirect(auth, provider);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
