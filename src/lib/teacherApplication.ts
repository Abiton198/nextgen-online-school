import { auth, db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function submitTeacherApplication(formData: {
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

  // 🔹 Write application into pendingTeachers/{uid}
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

    role: "teacher",
    status: "pending",
    applicationStage: "applied", // ✅ ensures status page shows correctly
    createdAt: serverTimestamp(),
  });

  return true;
}
