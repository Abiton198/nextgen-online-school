import { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

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
    const data = Object.fromEntries(params.entries());

    const regId = data.m_payment_id;
    const paymentStatus = data.payment_status;
    const amount = data.amount_gross || "0.00";
    const pfPaymentId = data.pf_payment_id;

    if (!regId) {
      return { statusCode: 400, body: "Missing registration ID" };
    }

    // ✅ 1. Verify PayFast Signature
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const signatureParams = new URLSearchParams();

    Object.keys(data)
      .filter((key) => key !== "signature")
      .sort()
      .forEach((key) => {
        signatureParams.append(key, data[key]);
      });

    if (passphrase) signatureParams.append("passphrase", passphrase);

    const crypto = await import("crypto");
    const computedSig = crypto
      .createHash("md5")
      .update(signatureParams.toString())
      .digest("hex");

    if (computedSig !== data.signature) {
      console.warn("⚠️ Invalid PayFast signature:", data);
      return { statusCode: 400, body: "Invalid signature" };
    }

    // ✅ 2. Validate source with PayFast server
    const validateRes = await fetch("https://www.payfast.co.za/eng/query/validate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const validationBody = await validateRes.text();

    if (!validationBody.includes("VALID")) {
      console.warn("⚠️ PayFast validation failed:", validationBody);
      return { statusCode: 400, body: "PayFast validation failed" };
    }

    // ✅ 3. Verify Firestore registration data before logging
    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }

    const regData = regSnap.data();
    const expectedEmail = regData?.parentEmail?.toLowerCase();
    const expectedAmount = parseFloat(regData?.expectedAmount || "0");
    const receivedAmount = parseFloat(amount || "0");

    if (expectedEmail && data.email_address?.toLowerCase() !== expectedEmail) {
      console.warn("⚠️ Email mismatch:", {
        expected: expectedEmail,
        received: data.email_address,
      });
      return { statusCode: 400, body: "Email mismatch" };
    }

    if (expectedAmount && Math.abs(receivedAmount - expectedAmount) > 0.01) {
      console.warn("⚠️ Amount mismatch:", {
        expected: expectedAmount,
        received: receivedAmount,
      });
      return { statusCode: 400, body: "Amount mismatch" };
    }

    // ✅ 4. Record verified payment
    const paymentsRef = regRef.collection("payments").doc(pfPaymentId || undefined);
    await paymentsRef.set({
      pfPaymentId,
      amount,
      paymentStatus,
      raw: data,
      verified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await regRef.update({
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentStatus: paymentStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Verified and logged PayFast payment:", pfPaymentId);
    return { statusCode: 200, body: "Payment verified and logged" };
  } catch (err: any) {
    console.error("❌ PayFast notify error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
