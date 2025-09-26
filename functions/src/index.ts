import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: "admin" | "principal" | "teacher" | "student" | "parent";
  extraData?: Record<string, any>;
}

interface DeleteUserData {
  targetUid: string;
  role: "admin" | "principal" | "teacher" | "student" | "parent";
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
export const createUserProfile = functions
  .region("us-central1")
  .https.onCall(
    async (data: CreateUserData, context: functions.https.CallableContext) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "You must be logged in to perform this action."
        );
      }

      const claims: any = context.auth.token;
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
        // 1. Create Auth user
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        // 2. Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // 3. Save Firestore profile (✅ always has uid, email, name, role)
        await admin
          .firestore()
          .collection(`${role}s`) // admins, principals, teachers, students, parents
          .doc(userRecord.uid)
          .set({
            uid: userRecord.uid,
            email,
            name,
            role,
            ...extraData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // 4. Audit log
        await logAudit(
          "create",
          context.auth.uid,
          (context.auth.token as any).email || null,
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
export const deleteUser = functions
  .region("us-central1")
  .https.onCall(
    async (data: DeleteUserData, context: functions.https.CallableContext) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "You must be logged in to call this function."
        );
      }

      const claims: any = context.auth.token;
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
        // 1. Delete Auth account
        await admin.auth().deleteUser(targetUid);

        // 2. Delete Firestore profile
        await admin.firestore().collection(`${role}s`).doc(targetUid).delete();

        // 3. Audit log
        await logAudit(
          "delete",
          context.auth.uid,
          (context.auth.token as any).email || null,
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
