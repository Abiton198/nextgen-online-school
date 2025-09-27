import { getFunctions, httpsCallable } from "firebase/functions";
import {
  getAuth,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { app, db } from "@/lib/firebaseConfig";

const functions = getFunctions(app, "us-central1");

// 🔒 Type-safe roles
export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  PARENT: "parent",
  ADMIN: "admin",
  PRINCIPAL: "principal",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

type CreateUserResponse = {
  success: boolean;
  uid?: string;
  message?: string;
};

type DeleteUserResponse = {
  success: boolean;
  message: string;
};

/**
 * Forces refresh of current user's ID token to get updated custom claims (like role).
 */
async function refreshAuthToken() {
  const auth = getAuth(app);
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
}

/**
 * Create a user profile (Admin only, via Cloud Function).
 */
export async function createUserProfile(
  role: Role,
  email: string,
  password: string,
  name: string,
  extraData?: Record<string, any>
): Promise<CreateUserResponse> {
  if (!role || !email || !password || !name) {
    throw new Error("❌ createUserProfile: role, email, password, and name are required.");
  }

  try {
    const fn = httpsCallable(functions, "createUserProfile");
    const result = await fn({ role, email, password, name, extraData });

    await refreshAuthToken();

    return result.data as CreateUserResponse;
  } catch (err: any) {
    console.error("❌ createUserProfile error:", err);
    throw new Error(
      `${err.code || "internal"}: ${err.message || "Failed to create user profile"}`
    );
  }
}

/**
 * Delete a user profile (Admin only, via Cloud Function).
 */
export async function deleteUserProfile(
  targetUid: string,
  role: Role
): Promise<DeleteUserResponse> {
  if (!targetUid || !role) {
    throw new Error("❌ deleteUserProfile: targetUid and role are required.");
  }

  try {
    const fn = httpsCallable(functions, "deleteUser");
    const result = await fn({ targetUid, role });

    await refreshAuthToken();

    return result.data as DeleteUserResponse;
  } catch (err: any) {
    console.error("❌ deleteUserProfile error:", err);
    throw new Error(
      `${err.code || "internal"}: ${err.message || "Failed to delete user profile"}`
    );
  }
}

/**
 * Reset user password (sends reset email).
 */
export async function resetUserPassword(email: string) {
  if (!email) {
    throw new Error("❌ resetUserPassword: email is required.");
  }

  try {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: `Password reset link sent to ${email}` };
  } catch (err: any) {
    console.error("❌ resetUserPassword error:", err);
    throw new Error(
      `${err.code || "internal"}: ${err.message || "Failed to send password reset email"}`
    );
  }
}

/**
 * Parent signup (self-service).
 * Creates both parent doc and initial registration doc.
 */
export async function signupParent(
  email: string,
  password: string,
  parentData: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
  }
) {
  const auth = getAuth(app);
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  // 1️⃣ Create parent record
  await setDoc(doc(db, "parents", uid), {
    uid,
    email,
    role: ROLES.PARENT,
    ...parentData,
    createdAt: new Date().toISOString(),
  });

  // 2️⃣ Create linked registration doc
  const regRef = doc(collection(db, "registrations"));
  await setDoc(regRef, {
    parentId: uid,
    purpose: "fees",
    status: "payment_pending",
    paymentReceived: false,
    createdAt: new Date().toISOString(),
  });

  // 3️⃣ Save regId reference in parent doc
  await setDoc(
    doc(db, "parents", uid),
    { registrationId: regRef.id },
    { merge: true }
  );

  return userCred.user;
}

/**
 * Teacher signup (goes into pendingTeachers for approval).
 */
export async function signupTeacher(
  email: string,
  password: string,
  teacherData: {
    name: string;
    subject?: string;
    phone?: string;
  }
) {
  const auth = getAuth(app);
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "pendingTeachers", userCred.user.uid), {
    uid: userCred.user.uid,
    email,
    role: ROLES.TEACHER,
    status: "pending",
    ...teacherData,
    createdAt: new Date().toISOString(),
  });

  return userCred.user;
}
