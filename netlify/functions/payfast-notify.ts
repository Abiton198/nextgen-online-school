import { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";

// ✅ Initialize Firebase Admin once globally
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

    // ✅ Read incoming PayFast ITN payload
    const params = new URLSearchParams(event.body || "");
    const paymentId = params.get("m_payment_id"); // from your frontend
    const paymentStatus = params.get("payment_status"); // COMPLETE, FAILED, etc.
    const amount = params.get("amount_gross") || "0.00";
    const pfPaymentId = params.get("pf_payment_id");
    const itemName = params.get("item_name");

    if (!paymentId) {
      console.warn("⚠️ Missing m_payment_id in ITN");
      return { statusCode: 400, body: "Missing payment ID" };
    }

    console.log(`🔔 PayFast ITN received: ${paymentId}, status: ${paymentStatus}`);

    // ✅ Decide where to store the payment
    // If you used the user's UID as `m_payment_id`, store under /parents/{uid}/payments
    const parentRef = db.collection("parents").doc(paymentId);
    const parentSnap = await parentRef.get();

    if (!parentSnap.exists) {
      console.warn(`⚠️ Parent not found for ID: ${paymentId}`);
      // Optionally: you can skip or log to a fallback collection
      return { statusCode: 404, body: "Parent not found" };
    }

    // ✅ Log payment in subcollection
    const paymentsRef = parentRef.collection("payments").doc(pfPaymentId || "unknown");
    await paymentsRef.set({
      pfPaymentId,
      itemName,
      amount,
      paymentStatus,
      raw: Object.fromEntries(params.entries()), // store entire ITN payload
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Update parent’s summary fields
    await parentRef.update({
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentStatus: paymentStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ PayFast payment logged successfully.");

    return { statusCode: 200, body: "Payment logged successfully" };
  } catch (err: any) {
    console.error("❌ PayFast notify error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
