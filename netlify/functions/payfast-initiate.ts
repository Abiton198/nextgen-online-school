import type { Handler } from "@netlify/functions";

const USE_SANDBOX = process.env.NODE_ENV !== "production";
const PAYFAST_BASE = USE_SANDBOX
  ? "https://sandbox.payfast.co.za"
  : "https://www.payfast.co.za";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // from client
    const { regId, purpose, customAmount, itemName, parent } = body as {
      regId: string;
      purpose: "registration" | "fees" | "donation" | "event" | "other";
      customAmount?: string;
      itemName?: string;
      parent: { firstName: string; lastName: string; email: string };
    };

    if (!regId || !purpose || !parent?.email) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    // server-only config
    const merchant_id = process.env.PAYFAST_MERCHANT_ID || "";
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY || "";
    const SITE_URL = process.env.SITE_URL || "";

    if (!merchant_id || !merchant_key || !SITE_URL) {
      return { statusCode: 500, body: "Server is missing configuration" };
    }

    const defaultAmounts: Record<typeof purpose, string> = {
      registration: "1000.00",
      fees: "2850.00",
      donation: "100.00",
      event: "250.00",
      other: "100.00",
    };

    const defaultItems: Record<typeof purpose, string> = {
      registration: "Registration Fee",
      fees: "Tuition Fees",
      donation: "Donation",
      event: "Event Ticket",
      other: "Other Payment",
    };

    const amount = (customAmount && Number(customAmount) > 0)
      ? Number(customAmount).toFixed(2)
      : defaultAmounts[purpose];

    const item_name = itemName || defaultItems[purpose];

    // Build PayFast params (no secrets exposed to client)
    const params = new URLSearchParams({
      merchant_id,
      merchant_key,
      return_url: `${SITE_URL}/payment-success?regId=${encodeURIComponent(regId)}`,
      cancel_url: `${SITE_URL}/payment-cancel`,
      notify_url: `${SITE_URL}/.netlify/functions/payfast-notify`,
      name_first: parent.firstName || "Parent",
      name_last: parent.lastName || "User",
      email_address: parent.email,
      m_payment_id: regId,
      amount,
      item_name,
    });

    const redirectUrl = `${PAYFAST_BASE}/eng/process?${params.toString()}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl }),
    };
  } catch (err) {
    console.error("payfast-initiate error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
