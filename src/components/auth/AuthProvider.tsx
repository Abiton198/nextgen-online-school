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
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  signup: (email: string, password: string) => Promise<FirebaseUser>;
  loginWithGoogle: (extraData?: Record<string, any>) => Promise<FirebaseUser | void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
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

      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = idTokenResult.claims;

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
                role: claims.role || data.role || baseRole,
                status: data.status || (isPending ? "pending" : "approved"),
              });
            } else {
              setUser({
                ...firebaseUser,
                role: claims.role || "unassigned",
                status: "unknown",
              });
            }
            setLoading(false);
          });

          break;
        }
      }

      if (!profileFound) {
        setUser({
          ...firebaseUser,
          role: claims.role || "unassigned",
          status: "unknown",
        });
        setLoading(false);
      }
    });

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

  const signup = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user; // ✅ always return user, not UserCredential
  };

  const loginWithGoogle = async (extraData: Record<string, any> = {}) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      const uid = gUser.uid;
      const teacherRef = doc(db, "teachers", uid);
      const pendingRef = doc(db, "pendingTeachers", uid);

      const teacherSnap = await getDoc(teacherRef);
      const pendingSnap = await getDoc(pendingRef);

      if (teacherSnap.exists()) {
        // ✅ Already approved teacher → update profile if needed
        await updateDoc(teacherRef, {
          ...extraData,
          updatedAt: serverTimestamp(),
        });
      } else if (pendingSnap.exists()) {
        // 🟡 Pending teacher → merge new data
        await updateDoc(pendingRef, {
          ...extraData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // 🆕 New teacher → create pending application (NO role/status here!)
        await setDoc(pendingRef, {
          uid,
          email: gUser.email!,
          firstName: gUser.displayName?.split(" ")[0] || "",
          lastName: gUser.displayName?.split(" ")[1] || "",
          ...extraData,
          applicationStage: "applied",
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
    <AuthContext.Provider
      value={{ user, loading, login, signup, loginWithGoogle, logout, setUser }}
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
