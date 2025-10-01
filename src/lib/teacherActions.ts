import { auth, db } from "@/lib/firebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface Reference {
  name: string;
  contact: string;
}

export interface UserRecord {
  uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  subject?: string;
  status?: string;

  gender?: string;
  province?: string;
  country?: string;
  address?: string;
  contact?: string;
  experience?: string;
  previousSchool?: string;
  references?: Reference[];

  idUrl?: string;
  qualUrl?: string;
  photoUrl?: string;
  cetaUrl?: string;
  workPermitUrl?: string;

  applicationStage?: string;
}

// ---------------- Teacher submits application ----------------
export async function submitTeacherApplication(formData: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  contact: string;
  province?: string;
  country?: string;
  address?: string;
  experience?: string;
  previousSchool?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to submit an application");

  const uid = user.uid;

  // 🔹 Only personal data + applicationStage
  await setDoc(doc(db, "pendingTeachers", uid), {
    uid,
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    subject: formData.subject,
    contact: formData.contact,
    province: formData.province || "",
    country: formData.country || "",
    address: formData.address || "",
    experience: formData.experience || "",
    previousSchool: formData.previousSchool || "",

    applicationStage: "applied",
    createdAt: serverTimestamp(),
  });

  return true;
}

// ---------------- Principal approves teacher ----------------
export async function approveTeacher(
  teacher: UserRecord,
  principalUid: string
) {
  if (!principalUid) throw new Error("Principal not authenticated.");

  const safeTeacher = {
    uid: teacher.uid,
    firstName: teacher.firstName || "",
    lastName: teacher.lastName || "",
    email: teacher.email || "",
    subject: teacher.subject || "",
    gender: teacher.gender || "",
    province: teacher.province || "",
    country: teacher.country || "",
    address: teacher.address || "",
    contact: teacher.contact || "",
    experience: teacher.experience || "",
    previousSchool: teacher.previousSchool || "",
    references: teacher.references || [],

    // documents
    idUrl: teacher.idUrl || "",
    qualUrl: teacher.qualUrl || "",
    photoUrl: teacher.photoUrl || "",
    cetaUrl: teacher.cetaUrl || "",
    workPermitUrl: teacher.workPermitUrl || "",

    // approval metadata
    role: "teacher",
    status: "approved",
    applicationStage: "approved",
    approvedAt: serverTimestamp(),
    approvedBy: principalUid,
  };

  await setDoc(doc(db, "teachers", teacher.uid), safeTeacher, { merge: true });
  await deleteDoc(doc(db, "pendingTeachers", teacher.uid));
}

// ---------------- Principal rejects teacher ----------------
export async function rejectTeacher(
  teacher: UserRecord,
  principalUid: string
) {
  if (!principalUid) throw new Error("Principal not authenticated.");

  await updateDoc(doc(db, "pendingTeachers", teacher.uid), {
    applicationStage: "rejected",
    status: "rejected",
    reviewedAt: serverTimestamp(),
    reviewedBy: principalUid,
  });
}
