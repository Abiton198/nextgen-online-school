// pages/api/payfast-initiate.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { purpose, customAmount, itemName, regId, parent } = req.body;

  // 💰 Fixed amounts by purpose
  const defaultAmounts: Record<string, string> = {
    registration: "1000.00",
    fees: "2850.00",
    donation: "100.00",  // fallback if no amount
    event: "250.00",     // fallback if no amount
    other: "100.00",
  };

  // 🏷️ Default item names
  const defaultItems: Record<string, string> = {
    registration: "Registration Fee",
    fees: "Tuition Fees",
    donation: "Donation",
    event: "Event Ticket",
    other: "Other Payment",
  };

  // ✅ Final amount logic
  let finalAmount: string;
  if (purpose === "donation" || purpose === "event" || purpose === "other") {
    // allow custom amount, but fallback to default
    finalAmount = customAmount && Number(customAmount) > 0
      ? Number(customAmount).toFixed(2)
      : defaultAmounts[purpose];
  } else {
    // enforce fixed for registration/fees
    finalAmount = defaultAmounts[purpose];
  }

  const finalItemName = itemName || defaultItems[purpose];

  const payfastUrl = "https://www.payfast.co.za/eng/process";

  const params = new URLSearchParams({
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${req.headers.origin}/payment-success?regId=${regId}`,
    cancel_url: `${req.headers.origin}/payment-cancel`,
    notify_url: `${req.headers.origin}/api/payfast-notify`,
    m_payment_id: regId,
    name_first: parent.firstName,
    name_last: parent.lastName,
    email_address: parent.email,
    amount: finalAmount,
    item_name: finalItemName,
  });

  res.status(200).json({ redirectUrl: `${payfastUrl}?${params.toString()}` });
}
