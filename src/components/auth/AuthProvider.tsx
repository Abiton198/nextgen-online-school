import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig"; // adjust import to your setup
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = firebaseUser.uid;

      // collections to check (approved + pending)
      const roleCollections = [
        "admins",
        "principals",
        "teachers",
        "students",
        "parents",
        "pendingTeachers",
        "pendingStudents",
      ];

      let unsubProfile: (() => void) | null = null;

      for (const collectionName of roleCollections) {
        const ref = doc(db, collectionName, uid);

        unsubProfile = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const isPending = collectionName.startsWith("pending");
            const baseRole = isPending
              ? collectionName.replace("pending", "").toLowerCase().slice(0, -1) // e.g. pendingTeachers → teacher
              : collectionName.slice(0, -1); // teachers → teacher

            setUser({
              ...firebaseUser,
              ...data,
              role: data.role || baseRole,
              status: data.status || (isPending ? "pending" : "approved"),
            });
            setLoading(false);
          }
        });

        // once we set up a listener for the first existing doc, stop looping
        break;
      }

      if (!unsubProfile) {
        console.warn("⚠️ No profile found for user, assigning role = unassigned");
        setUser({ ...firebaseUser, role: "unassigned", status: "unknown" });
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
