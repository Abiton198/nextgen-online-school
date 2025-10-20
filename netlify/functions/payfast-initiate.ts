import type { Handler } from "@netlify/functions";
import crypto from "crypto";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      purpose,
      amount,
      itemName,
      regId,
      parentId,
      parentEmail,
      paymentId,
    } = JSON.parse(event.body || "{}");

    if (!amount || !regId || !paymentId || !parentEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const isSandbox = process.env.PAYFAST_MODE === "sandbox";
    const payfastURL = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const merchant_id = process.env.PAYFAST_MERCHANT_ID!;
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY!;
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const siteUrl = process.env.SITE_URL!;

    // ✅ Include regId + paymentId in redirect URLs
    const return_url = `${siteUrl}/parent/payments?status=success&regId=${regId}&paymentId=${paymentId}`;
    const cancel_url = `${siteUrl}/parent/payments?status=cancel&regId=${regId}&paymentId=${paymentId}`;
    const notify_url = `${siteUrl}/.netlify/functions/payfast-notify`;

    // ✅ Sorted PayFast data (alphabetical keys)
    const data = {
      amount: Number(amount).toFixed(2),
      cancel_url,
      email_address: parentEmail,
      item_name: itemName || purpose,
      m_payment_id: paymentId, // ensures 1:1 with Firestore
      merchant_id,
      merchant_key,
      name_first: "Parent",
      notify_url,
      return_url,
    };

    // ✅ Construct and hash with optional passphrase
    const params = new URLSearchParams();
    Object.keys(data)
      .sort()
      .forEach((key) => {
        params.append(key, data[key as keyof typeof data]!.toString());
      });

    if (passphrase) params.append("passphrase", passphrase);

    const signature = crypto
      .createHash("md5")
      .update(params.toString())
      .digest("hex");

    const redirectUrl = `${payfastURL}?${params.toString()}&signature=${signature}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl }),
    };
  } catch (err) {
    console.error("❌ PayFast initiate error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
