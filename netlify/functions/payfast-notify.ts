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

    // ✅ Get PayFast mode + merchant info (now prefixed with VITE_)
    const mode = process.env.VITE_PAYFAST_MODE;
    const merchantId = process.env.VITE_PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.VITE_PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      console.error("❌ Missing PayFast merchant credentials in environment");
      return { statusCode: 500, body: "Merchant credentials not configured" };
    }

    // ✅ Parse PayFast ITN (Instant Transaction Notification)
    const params = new URLSearchParams(event.body || "");
    const regId = params.get("m_payment_id");
    const paymentStatus = params.get("payment_status"); // COMPLETE, FAILED, etc.
    const amount = params.get("amount_gross") || "0.00";
    const pfPaymentId = params.get("pf_payment_id");

    if (!regId) {
      return { statusCode: 400, body: "Missing registration ID" };
    }

    console.log(`🔔 PayFast ITN received for regId: ${regId}, status: ${paymentStatus}`);

    // ✅ Locate registration
    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      console.warn(`⚠️ Registration not found for ID: ${regId}`);
      return { statusCode: 404, body: "Registration not found" };
    }

    // ✅ Log payment in subcollection
    const paymentsRef = regRef.collection("payments").doc();
    await paymentsRef.set({
      pfPaymentId,
      amount,
      paymentStatus,
      raw: Object.fromEntries(params.entries()), // store full payload
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Update registration summary fields
    await regRef.update({
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentStatus: paymentStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Payment logged successfully in Firestore");

    return { statusCode: 200, body: "Payment logged" };
  } catch (err: any) {
    console.error("❌ PayFast notify error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
