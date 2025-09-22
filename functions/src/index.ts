import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: "admin" | "teacher" | "student" | "parent";
  extraData?: Record<string, any>;
}

interface DeleteUserData {
  targetUid: string;
  role: "admin" | "teacher" | "student" | "parent";
}

/**
 * Logs admin actions in Firestore under /auditLogs
 */
async function logAudit(
  action: "create" | "delete",
  performedBy: string,
  performedByEmail: string | null,
  targetUid: string,
  role: string,
  details: Record<string, any> = {}
) {
  await admin.firestore().collection("auditLogs").add({
    action,
    performedBy,
    performedByEmail,
    targetUid,
    role,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Create user (Auth + Firestore + custom claims).
 */
export const createUserProfile = functions.https.onCall(
  { region: "us-central1" },
  async (request: functions.https.CallableRequest<CreateUserData>) => {
    const data = request.data;
    const auth = request.auth;

    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to perform this action."
      );
    }

    const claims: any = auth.token;
    if (claims.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can create users."
      );
    }

    const { email, password, name, role, extraData } = data;

    if (!email || !password || !name || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "email, password, name, and role are required."
      );
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      await admin.firestore().collection(`${role}s`).doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        role,
        ...extraData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 🔑 Log creation
      await logAudit(
        "create",
        auth.uid,
        (auth.token as any).email || null,
        userRecord.uid,
        role,
        { email, name }
      );

      return { success: true, uid: userRecord.uid };
    } catch (err: any) {
      console.error("Create user error:", err);
      throw new functions.https.HttpsError(
        "internal",
        err?.message || "Unknown error"
      );
    }
  }
);

/**
 * Delete user (Auth + Firestore).
 */
export const deleteUser = functions.https.onCall(
  { region: "us-central1" },
  async (request: functions.https.CallableRequest<DeleteUserData>) => {
    const data = request.data;
    const auth = request.auth;

    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to call this function."
      );
    }

    const claims: any = auth.token;
    if (claims.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can delete users."
      );
    }

    const { targetUid, role } = data;

    if (!targetUid || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "targetUid and role are required."
      );
    }

    try {
      await admin.auth().deleteUser(targetUid);
      await admin.firestore().collection(`${role}s`).doc(targetUid).delete();

      // 🔑 Log deletion
      await logAudit(
        "delete",
        auth.uid,
        (auth.token as any).email || null,
        targetUid,
        role
      );

      return { success: true, message: `User ${targetUid} deleted.` };
    } catch (err: any) {
      console.error("Delete user error:", err);
      throw new functions.https.HttpsError(
        "internal",
        err?.message || "Unknown error"
      );
    }
  }
);
