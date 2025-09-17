import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

// ✅ Allow admin to create Teacher, Student, or Parent profile
const createUserProfile = async (
  role: "student" | "teacher" | "parent",
  email: string,
  password: string,
  name: string,
  extraData?: Record<string, any>
) => {
  try {
    // 1. Create Firebase Auth account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Create Firestore profile (uid as document ID)
    await setDoc(doc(db, `${role}s`, cred.user.uid), {
      uid: cred.user.uid,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "system",
      ...extraData, // optional: grade for students, subject for teachers, etc.
    });

    alert(`${role} profile created successfully!`);
  } catch (err: any) {
    console.error("❌ Error creating profile:", err);
    alert(err.message || "Failed to create profile.");
  }
};
