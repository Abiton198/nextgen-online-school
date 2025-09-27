import { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
    ),
  });
}
const db = admin.firestore();

export const handler: Handler = async (event) => {
  try {
    const params = new URLSearchParams(event.body || "");
    const regId = params.get("m_payment_id");
    const paymentStatus = params.get("payment_status");

    if (!regId) return { statusCode: 400, body: "Missing regId" };

    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();
    if (!regSnap.exists) return { statusCode: 404, body: "Registration not found" };

    const regData = regSnap.data();

    if (paymentStatus === "COMPLETE") {
      // ✅ Update registration
      await regRef.update({
        status: "awaiting_approval",
        paymentReceived: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ Create student record
      await db.collection("students").add({
        parentId: regData?.parentId,
        ...regData?.studentInfo,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
      });
    } else {
      // ❌ Payment failed
      await regRef.update({
        status: "payment_failed",
        paymentReceived: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("PayFast notify error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
