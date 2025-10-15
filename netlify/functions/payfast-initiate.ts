import type { Handler } from "@netlify/functions";
import crypto from "crypto";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { purpose, amount, itemName, regId, parentId, parentEmail, paymentId } = JSON.parse(event.body || "{}");

    if (!amount || !regId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing amount or regId" }) };
    }

    const isSandbox = process.env.PAYFAST_MODE === "sandbox";
    const payfastURL = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const merchant_id = process.env.PAYFAST_MERCHANT_ID;
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
    const return_url = `${process.env.SITE_URL}/parent/payments?status=success`;
    const cancel_url = `${process.env.SITE_URL}/parent/payments?status=cancel`;
    const notify_url = `${process.env.SITE_URL}/.netlify/functions/payfast-notify`;

    const data = {
      merchant_id,
      merchant_key,
      return_url,
      cancel_url,
      notify_url,
      name_first: "Parent",
      email_address: parentEmail,
      m_payment_id: regId, // you can change this to paymentId if you want unique mapping
      amount,
      item_name: itemName || purpose,
    };

    // Generate signature
    const pfString = Object.entries(data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const signature = crypto.createHash("md5").update(pfString).digest("hex");

    const redirectUrl = `${payfastURL}?${pfString}&signature=${signature}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl }),
    };
  } catch (err) {
    console.error("❌ PayFast initiate error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
