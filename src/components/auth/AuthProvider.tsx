// components/auth/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface EnrichedUser {
  uid: string;
  email: string | null;
  role: "student" | "teacher" | "parent" | "principal" | null;
  status?: string;
  [key: string]: any; // optional extra fields
}

interface AuthContextType {
  user: EnrichedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EnrichedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let enriched: EnrichedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: null,
        };

        // 🔎 Look up role in Firestore
        const roles = [
          { col: "teachers", role: "teacher" },
          { col: "students", role: "student" },
          { col: "parents", role: "parent" },
          { col: "principals", role: "principal" },
        ];

        for (const { col, role } of roles) {
          const ref = doc(db, col, firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            enriched = { ...enriched, ...snap.data(), role };
            break;
          }
        }

        setUser(enriched);
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
    // you can wire in GoogleAuthProvider like in LoginForm
    return null;
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
