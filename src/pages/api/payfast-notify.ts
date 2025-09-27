// pages/api/payfast-notify.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import fetch from "node-fetch";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// PayFast sandbox/live URL (use sandbox for testing!)
const PAYFAST_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const data = req.body as Record<string, string>;

    // 🔑 Step 1: Extract PayFast signature
    const receivedSig = data["signature"];
    delete data["signature"];

    // 🔑 Step 2: Rebuild signature string
    const queryString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");

    // 🔑 Step 3: Calculate our signature
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

    // 🔑 Step 5: Check payment status
    if (data["payment_status"] === "COMPLETE") {
      const regId = data["m_payment_id"]; // we set this in redirectToPayfast
      const amount = data["amount_gross"];

      // ✅ Update Firestore: mark payment received
      await admin.firestore().collection("registrations").doc(regId).update({
        paymentStatus: "paid",
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
