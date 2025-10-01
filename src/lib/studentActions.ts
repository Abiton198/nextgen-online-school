import { db } from "@/lib/firebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface UserRecord {
  uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  parentId?: string;
  contact?: string;
  province?: string;
  country?: string;
  address?: string;
  grade?: string;
  gender?: string;
  status?: string;
  applicationStage?: string;
}

// ---------------- Student submits application ----------------
// (Handled in your signup flow, not here. This file is only for principal actions.)

// ---------------- Principal approves student ----------------
export async function approveStudent(student: UserRecord, principalUid: string) {
  if (!principalUid) throw new Error("Principal not authenticated.");

  const safeStudent = {
    uid: student.uid,
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    email: student.email || "",
    parentId: student.parentId || "",
    contact: student.contact || "",
    province: student.province || "",
    country: student.country || "",
    address: student.address || "",
    grade: student.grade || "",
    gender: student.gender || "",

    role: "student",
    status: "approved",
    applicationStage: "approved",
    approvedAt: serverTimestamp(),
    approvedBy: principalUid,
  };

  await setDoc(doc(db, "students", student.uid), safeStudent, { merge: true });
  await deleteDoc(doc(db, "pendingStudents", student.uid));
}

// ---------------- Principal rejects student ----------------
export async function rejectStudent(student: UserRecord, principalUid: string) {
  if (!principalUid) throw new Error("Principal not authenticated.");

  await updateDoc(doc(db, "pendingStudents", student.uid), {
    applicationStage: "rejected",
    status: "rejected",
    reviewedAt: serverTimestamp(),
    reviewedBy: principalUid,
  });
}
