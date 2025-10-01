import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export interface UserRecord {
  uid: string;
  role: string;
  status?: string;
}

// ---------------- Suspend any user ----------------
export async function suspendUser(user: UserRecord) {
  const collectionName = user.role === "teacher" ? "teachers" : "students";
  await setDoc(
    doc(db, collectionName, user.uid),
    {
      status: "suspended",
      suspendedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ---------------- Reinstate any user ----------------
export async function reinstateUser(user: UserRecord) {
  const collectionName = user.role === "teacher" ? "teachers" : "students";
  await setDoc(
    doc(db, collectionName, user.uid),
    {
      status: "approved",
      reinstatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
