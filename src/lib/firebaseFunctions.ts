// src/lib/firebaseFunctions.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

const functions = getFunctions(app, "us-central1"); // 👈 ensure region matches deployment

// 🔒 Type-safe roles
export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  PARENT: "parent",
  ADMIN: "admin",
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
 * Create a user profile (Admin only).
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
 * Delete a user profile (Admin only).
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
