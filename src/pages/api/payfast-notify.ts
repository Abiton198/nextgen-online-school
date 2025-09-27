import type { Handler } from "@netlify/functions";
import crypto from "crypto";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Sandbox for dev, Live for production
const PAYFAST_VALIDATE_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    // 🔑 Step 1: Parse raw body
    const rawBody = event.body || "";
    const data: Record<string, string> = {};
    rawBody.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key) data[key] = decodeURIComponent(value || "");
    });

    // 🔑 Step 2: Extract and verify signature
    const receivedSig = data["signature"];
    delete data["signature"];

    const queryString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");

    const calculatedSig = crypto.createHash("md5").update(queryString).digest("hex");

    if (calculatedSig !== receivedSig) {
      console.error("❌ Invalid signature", { receivedSig, calculatedSig });
      return { statusCode: 400, body: "Invalid signature" };
    }

    // 🔑 Step 3: Validate with PayFast server
    const validateRes = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: queryString,
    });

    const validateText = await validateRes.text();
    if (!validateText.includes("VALID")) {
      console.error("❌ PayFast validation failed:", validateText);
      return { statusCode: 400, body: "Invalid PayFast validation" };
    }

    // 🔑 Step 4: Update Firestore
    const regId = data["m_payment_id"];
    const paymentStatus = data["payment_status"]?.trim().toUpperCase();
    const amount = data["amount_gross"];
    const payfastRef = data["pf_payment_id"];

    if (paymentStatus === "COMPLETE") {
      await admin.firestore().collection("registrations").doc(regId).update({
        status: "awaiting_approval",
        paymentReceived: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAmount: amount,
        payfastRef,
      });
      console.log(`✅ Payment complete for ${regId}, amount: R${amount}`);
    } else {
      await admin.firestore().collection("registrations").doc(regId).update({
        status: "payment_failed",
        lastPaymentAttempt: admin.firestore.FieldValue.serverTimestamp(),
        payfastRef,
      });
      console.warn("⚠️ Payment not complete:", data["payment_status"]);
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("❌ Error processing ITN:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
