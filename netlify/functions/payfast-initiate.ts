import type { Handler } from "@netlify/functions";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fetch from "node-fetch"; // Netlify includes this in Node 18+

// init Firebase Admin once
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
    const rawBody = event.body || "";
    const params = new URLSearchParams(rawBody);

    const regId = params.get("m_payment_id"); // our Firestore doc ID
    const paymentStatus = params.get("payment_status"); // "COMPLETE", "FAILED", "CANCELLED"

    if (!regId) {
      return { statusCode: 400, body: "Missing registration ID" };
    }

    // 🔐 validate with PayFast (ITN validation step)
    const validationUrl = `https://${
      process.env.NODE_ENV === "production"
        ? "www.payfast.co.za"
        : "sandbox.payfast.co.za"
    }/eng/query/validate`;

    const validateRes = await fetch(validationUrl, {
      method: "POST",
      body: rawBody,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const validationText = await validateRes.text();

    if (!validationText.includes("VALID")) {
      console.error("Invalid PayFast ITN:", validationText);
      return { statusCode: 400, body: "Invalid ITN" };
    }

    // 🔄 update Firestore
    const ref = db.collection("registrations").doc(regId);

    if (paymentStatus === "COMPLETE") {
      await ref.update({
        status: "awaiting_approval",
        paymentReceived: true,
        paymentConfirmedAt: new Date(),
      });
    } else {
      await ref.update({
        status: "payment_failed",
        paymentReceived: false,
        paymentFailedAt: new Date(),
      });
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("payfast-notify error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
