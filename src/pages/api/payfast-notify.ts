import { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";

// ✅ Initialize Firebase Admin once
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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const params = new URLSearchParams(event.body || "");
    const regId = params.get("m_payment_id"); // registrationId we passed to PayFast
    const paymentStatus = params.get("payment_status"); // COMPLETE, FAILED, etc.

    if (!regId) {
      return { statusCode: 400, body: "Missing registration ID" };
    }

    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }

    const regData = regSnap.data();

    if (paymentStatus === "COMPLETE") {
      // ✅ Update registration status
      await regRef.update({
        status: "awaiting_approval",
        paymentReceived: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ Create student record (if not already created)
      if (regData && regData.learnerData) {
        await db.collection("students").add({
          parentId: regData.parentId,
          ...regData.learnerData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "active",
        });
      }
    } else {
      // ❌ Payment failed
      await regRef.update({
        status: "payment_failed",
        paymentReceived: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { statusCode: 200, body: "Payment processed" };
  } catch (err: any) {
    console.error("PayFast notify error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
