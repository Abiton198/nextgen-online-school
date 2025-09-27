import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");

    // Required fields from frontend
    const { registrationId, parent, amount, itemName } = body;

    // Protect merchant details in env vars
    const payfastParams: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID || "",
      merchant_key: process.env.PAYFAST_MERCHANT_KEY || "",
      return_url: `${process.env.SITE_URL}/payment-success?regId=${registrationId}`,
      cancel_url: `${process.env.SITE_URL}/payment-cancel`,
      notify_url: `${process.env.SITE_URL}/.netlify/functions/payfast-notify`, // webhook
      amount: amount.toFixed(2),
      item_name: itemName,
      m_payment_id: registrationId,
      name_first: parent.firstName,
      name_last: parent.lastName,
      email_address: parent.email,
    };

    const query = new URLSearchParams(payfastParams).toString();
    const redirectUrl = `https://www.payfast.co.za/eng/process?${query}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl }),
    };
  } catch (err) {
    console.error("PayFast initiation error:", err);
    return { statusCode: 500, body: "Failed to initiate PayFast" };
  }
};
