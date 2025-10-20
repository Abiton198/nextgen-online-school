"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const payfastUrl =
  import.meta.env.VITE_PAYFAST_MODE === "sandbox"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

export default function PaymentsSection() {
  const { user } = useAuth();

  // These are automatically injected from Netlify environment variables
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
  const siteUrl = import.meta.env.VITE_SITE_URL;

  const [purpose, setPurpose] = useState("registration");
  const [customAmount, setCustomAmount] = useState("");
  const [itemName, setItemName] = useState("Registration Fee");

  const amount =
    purpose === "registration"
      ? "1000.00"
      : (Number(customAmount) || 0).toFixed(2);

  // Dynamic URLs
  const returnUrl = `${siteUrl}/parent/payments?status=success`;
  const cancelUrl = `${siteUrl}/parent/payments?status=cancel`;
  const notifyUrl = `${siteUrl}/.netlify/functions/payfast-notify`;

  return (
    <div className="p-6 border rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">Payments</h2>

      <form
        action={payfastUrl}
        method="post"
        target="_top"
        className="space-y-4"
      >
        {/* Hidden PayFast fields */}
        <input type="hidden" name="merchant_id" value={merchantId} />
        <input type="hidden" name="merchant_key" value={merchantKey} />
        <input type="hidden" name="return_url" value={returnUrl} />
        <input type="hidden" name="cancel_url" value={cancelUrl} />
        <input type="hidden" name="notify_url" value={notifyUrl} />
        <input type="hidden" name="name_first" value={user?.displayName || "Parent"} />
        <input type="hidden" name="email_address" value={user?.email || ""} />
        <input type="hidden" name="m_payment_id" value={user?.uid || "guest"} />
        <input type="hidden" name="item_name" value={itemName} />
        <input type="hidden" name="amount" value={amount} />

        {/* Payment Purpose */}
        <div>
          <label className="block mb-1 font-medium">Payment Purpose</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="registration">Registration Fee</option>
            <option value="fees">Tuition Fees</option>
            <option value="donation">Donation</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Custom Amount */}
        {(purpose === "donation" ||
          purpose === "event" ||
          purpose === "other") && (
          <div>
            <label className="block mb-1 font-medium">Amount (ZAR)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="Enter amount"
            />
          </div>
        )}

        {/* Item Name */}
        <div>
          <label className="block mb-1 font-medium">Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="e.g. Term 1 Fees"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          💳 Pay with PayFast
        </button>
      </form>
    </div>
  );
}
