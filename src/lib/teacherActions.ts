import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

interface UserRecord {
  uid: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  subject?: string;
  status?: string;
  [key: string]: any; // allow extra fields
}

// 🔹 Approve Teacher
export const approveTeacher = async (teacher: UserRecord, principalUid: string) => {
  const teacherRef = doc(db, "teachers", teacher.uid);

  await setDoc(teacherRef, {
    ...teacher,
    role: "teacher",
    status: "approved",
    applicationStage: "awaiting-documents", // 👈 Next step
    approvedAt: new Date().toISOString(),
    approvedBy: principalUid,
  });

  // Remove from pending collection
  await deleteDoc(doc(db, "pendingTeachers", teacher.uid));
};

// 🔹 Reject Teacher
export const rejectTeacher = async (teacher: UserRecord, principalUid: string) => {
  const pendingRef = doc(db, "pendingTeachers", teacher.uid);

  await setDoc(
    pendingRef,
    {
      ...teacher,
      status: "rejected",
      applicationStage: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: principalUid,
    },
    { merge: true }
  );
};
