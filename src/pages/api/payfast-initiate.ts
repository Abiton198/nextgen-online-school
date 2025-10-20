import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { purpose, amount, itemName, regId, parentId, parentEmail, paymentId } = req.body;

    if (!regId) {
      return res.status(400).json({ error: "Missing registration ID" });
    }

    if (!parentEmail) {
      return res.status(400).json({ error: "Missing parent email" });
    }

    const defaultAmounts: Record<string, string> = {
      registration: "1000.00",
      fees: "2850.00",
      donation: "100.00",
      event: "250.00",
      other: "100.00",
    };

    const defaultItems: Record<string, string> = {
      registration: "Registration Fee",
      fees: "Tuition Fees",
      donation: "Donation",
      event: "Event Ticket",
      other: "Other Payment",
    };

    const finalAmount =
      ["donation", "event", "other"].includes(purpose)
        ? Number(amount) > 0
          ? Number(amount).toFixed(2)
          : defaultAmounts[purpose]
        : defaultAmounts[purpose];

    const finalItemName = itemName || defaultItems[purpose];
    const payfastUrl = "https://www.payfast.co.za/eng/process";

    const baseUrl = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL!;
    const returnUrl = `${baseUrl}/dashboard/parent/payments?status=success&regId=${regId}`;
    const cancelUrl = `${baseUrl}/dashboard/parent/payments?status=cancel&regId=${regId}`;
    const notifyUrl = `${baseUrl}/api/payfast-notify`;

    const params = new URLSearchParams({
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      m_payment_id: paymentId || regId,
      name_first: parentId || "Parent",
      email_address: parentEmail,
      amount: finalAmount,
      item_name: finalItemName,
    });

    const redirectUrl = `${payfastUrl}?${params.toString()}`;
    if (!redirectUrl) throw new Error("Redirect URL not generated");

    return res.status(200).json({ redirectUrl });
  } catch (err: any) {
    console.error("❌ PayFast initiate error:", err);
    return res.status(500).json({ error: err.message });
  }
}
