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
    const amount = params.get("amount_gross") || "0.00";
    const pfPaymentId = params.get("pf_payment_id"); // PayFast’s ID

    if (!regId) {
      return { statusCode: 400, body: "Missing registration ID" };
    }

    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }

    // ✅ Always log payment
    const paymentsRef = regRef.collection("payments").doc();
    await paymentsRef.set({
      pfPaymentId,
      amount,
      paymentStatus,
      raw: Object.fromEntries(params.entries()), // store full ITN payload for audit
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Update quick references on registration
    await regRef.update({
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentStatus: paymentStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { statusCode: 200, body: "Payment logged" };
  } catch (err: any) {
    console.error("PayFast notify error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
