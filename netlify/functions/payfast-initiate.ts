import type { Handler } from "@netlify/functions";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")
    ),
  });
}
const db = getFirestore();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { regId } = JSON.parse(event.body || "{}");
    if (!regId) {
      return { statusCode: 400, body: "Missing regId" };
    }

    // 🔎 Fetch registration doc
    const ref = db.collection("registrations").doc(regId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }
    const registration = snap.data();

    // ✅ Always use trusted Firestore values
    const amount = registration?.fees || "2000.00";
    const parent = registration?.parent || {};
    const itemName = registration?.purpose || "Tuition Fees";

    // 🔄 Sandbox vs Live toggle
    const isLive = process.env.PAYFAST_MODE === "live";

    const payfastUrl = isLive
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

    const merchantId = isLive
      ? process.env.PAYFAST_MERCHANT_ID || ""
      : "10000100"; // Sandbox default

    const merchantKey = isLive
      ? process.env.PAYFAST_MERCHANT_KEY || ""
      : "46f0cd694581a"; // Sandbox default

    const params = new URLSearchParams({
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${process.env.SITE_URL}/payment-success?regId=${regId}`,
      cancel_url: `${process.env.SITE_URL}/payment-cancel`,
      notify_url: `${process.env.SITE_URL}/.netlify/functions/payfast-notify`,
      name_first: parent.firstName || "Parent",
      name_last: parent.lastName || "",
      email_address: parent.email || "",
      m_payment_id: regId,
      amount: amount,
      item_name: itemName,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: `${payfastUrl}?${params.toString()}` }),
    };
  } catch (err) {
    console.error("payfast-initiate error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
