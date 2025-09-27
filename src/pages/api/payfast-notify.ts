import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import fetch from "node-fetch";
import * as admin from "firebase-admin";
import getRawBody from "raw-body";

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

export const config = {
  api: {
    bodyParser: false, // important for PayFast signature
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    // 🔑 Step 1: Parse raw body
    const rawBody = (await getRawBody(req)).toString("utf-8");

    const data: Record<string, string> = {};
    rawBody.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      data[key] = decodeURIComponent(value || "");
    });

    // 🔑 Step 2: Extract and remove signature
    const receivedSig = data["signature"];
    delete data["signature"];

    // 🔑 Step 3: Rebuild query string for signature
    const queryString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");

    const calculatedSig = crypto.createHash("md5").update(queryString).digest("hex");

    if (calculatedSig !== receivedSig) {
      console.error("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // 🔑 Step 4: Validate with PayFast server
    const validateRes = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: queryString,
    });

    const validateText = await validateRes.text();
    if (!validateText.includes("VALID")) {
      console.error("❌ PayFast validation failed:", validateText);
      return res.status(400).send("Invalid PayFast validation");
    }

    // 🔑 Step 5: Update Firestore if COMPLETE
    if (data["payment_status"]?.trim().toUpperCase() === "COMPLETE") {
      const regId = data["m_payment_id"];
      const amount = data["amount_gross"];

      await admin.firestore().collection("registrations").doc(regId).update({
        status: "submitted",
        paymentReceived: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAmount: amount,
        payfastRef: data["pf_payment_id"],
      });

      console.log(`✅ Payment complete for ${regId}, amount: R${amount}`);
    } else {
      console.warn("⚠️ Payment not complete:", data["payment_status"]);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Error processing ITN:", err);
    res.status(500).send("Internal server error");
  }
}
