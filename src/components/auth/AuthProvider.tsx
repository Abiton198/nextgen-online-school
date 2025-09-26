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
} from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  loginWithGoogle: () => Promise<FirebaseUser | void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          if (unsubProfile) unsubProfile();
          return;
        }

        const uid = firebaseUser.uid;
        const roleCollections = [
          "admins",
          "principals",
          "teachers",
          "students",
          "parents",
          "pendingTeachers",
          "pendingStudents",
        ];

        let profileFound = false;

        for (const collectionName of roleCollections) {
          const ref = doc(db, collectionName, uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            profileFound = true;
            if (unsubProfile) unsubProfile();

            unsubProfile = onSnapshot(ref, (profileSnap) => {
              if (profileSnap.exists()) {
                const data = profileSnap.data();
                const isPending = collectionName.startsWith("pending");
                const baseRole = isPending
                  ? collectionName.replace("pending", "").toLowerCase().slice(0, -1)
                  : collectionName.slice(0, -1);

                setUser({
                  ...firebaseUser,
                  ...data,
                  role: data.role || baseRole,
                  status: data.status || (isPending ? "pending" : "approved"),
                });
              } else {
                setUser({
                  ...firebaseUser,
                  role: "unassigned",
                  status: "unknown",
                });
              }
              setLoading(false);
            });

            break;
          }
        }

        if (!profileFound) {
          setUser({ ...firebaseUser, role: "unassigned", status: "unknown" });
          setLoading(false);
        }
      }
    );

    // Handle Google redirect login results
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Try popup login first
      const result = await signInWithPopup(auth, provider);
      return result.user;
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
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
