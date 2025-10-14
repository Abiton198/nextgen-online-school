import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// ✅ Initialize Admin SDK once (safe for multiple imports)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------- Types ----------
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
 * 🔍 Utility: Log all sensitive admin actions to Firestore
 * This helps principals track user management operations for transparency.
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
 * 👤 Callable Function: Create a new user (Auth + Firestore + custom claim)
 * Restricted to Admin accounts only.
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
        // 1️⃣ Create Auth user
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        // 2️⃣ Assign custom claim for quick role-based access (used in Firestore & Storage)
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // 3️⃣ Create Firestore document under correct collection
        await admin
          .firestore()
          .collection(`${role}s`) // e.g. "teachers", "students"
          .doc(userRecord.uid)
          .set({
            uid: userRecord.uid,
            email,
            name,
            role,
            ...extraData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // 4️⃣ Record the action in audit log
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
 * 🗑️ Callable Function: Delete a user (Auth + Firestore cleanup)
 * Restricted to Admins only.
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
        // 1️⃣ Remove user from Firebase Authentication
        await admin.auth().deleteUser(targetUid);

        // 2️⃣ Delete associated Firestore profile
        await admin.firestore().collection(`${role}s`).doc(targetUid).delete();

        // 3️⃣ Log deletion
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

/**
 * 🔄 Auto-sync user role between Firestore `/users/{userId}` and Firebase Auth custom claims.
 * Ensures that both Firestore and Auth-based access (e.g., Storage rules) stay in sync.
 */
export const syncUserRoleClaims = functions
  .region("us-central1")
  .firestore.document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const afterData = change.after.exists ? change.after.data() : null;

    if (!afterData || !afterData.role) {
      console.log(`ℹ️ User ${userId} has no role field to sync`);
      return null;
    }

    const role = afterData.role;

    try {
      // 1️⃣ Update Firebase Auth custom claim
      await admin.auth().setCustomUserClaims(userId, { role });
      console.log(`✅ Synced role "${role}" for user ${userId}`);

      // 2️⃣ Optional: Write confirmation back to Firestore
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update({
          lastRoleSync: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error(`❌ Failed to sync role for user ${userId}:`, err);
    }

    return null;
  });
