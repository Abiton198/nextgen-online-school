// components/auth/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";

interface AuthContextType {
  user: any; // you may have enriched user object with role/status
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;   // ✅ new
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 🔹 attach role/status via Firestore or custom claims fetch
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: "parent", status: "active" });
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
    // you already have this implemented
    return null;
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);   // ✅

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
