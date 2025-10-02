import type { Handler } from "@netlify/functions";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")),
  });
}
const db = getFirestore();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const params = new URLSearchParams(event.body || "");
    const regId = params.get("m_payment_id");
    const paymentStatus = params.get("payment_status"); // "COMPLETE" | "FAILED" etc.
    const amount = params.get("amount_gross") || "0";
    const pfData = Object.fromEntries(params.entries());

    if (!regId) {
      return { statusCode: 400, body: "Missing m_payment_id" };
    }

    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();
    if (!regSnap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }

    // ✅ Add payment record
    const payRef = regRef.collection("payments").doc();
    await payRef.set({
      amount,
      paymentStatus,
      processedAt: new Date(),
      pfData,
    });

    // ✅ Optional quick reference on registration
    await regRef.update({
      lastPaymentStatus: paymentStatus,
      lastPaymentAt: new Date(),
    });

    console.log("✅ Payment recorded:", regId, paymentStatus);

    return { statusCode: 200, body: "ITN processed" };
  } catch (err) {
    console.error("❌ payfast-notify error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
