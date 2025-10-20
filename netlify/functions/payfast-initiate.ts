import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { amount, itemName, regId, parentEmail, paymentId } = JSON.parse(event.body || "{}");

    if (!amount || !regId || !paymentId || !parentEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const payfastUrl = process.env.PAYFAST_MODE === "sandbox"
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const params = new URLSearchParams({
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.SITE_URL}/parent/payments?status=success&regId=${regId}&paymentId=${paymentId}`,
      cancel_url: `${process.env.SITE_URL}/parent/payments?status=cancel&regId=${regId}&paymentId=${paymentId}`,
      notify_url: `${process.env.SITE_URL}/.netlify/functions/payfast-notify`,
      name_first: "Parent",
      email_address: parentEmail,
      m_payment_id: paymentId,
      amount: Number(amount).toFixed(2),
      item_name: itemName || "Payment",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        redirectUrl: `${payfastUrl}?${params.toString()}`,
      }),
    };
  } catch (err) {
    console.error("PayFast initiate error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};
