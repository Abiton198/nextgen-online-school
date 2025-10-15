"use client";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";

const PaymentsSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const regId = searchParams.get("regId");

  const [purpose, setPurpose] = useState("registration");
  const [customAmount, setCustomAmount] = useState("");
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  // Show status if redirected back
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setAlert({ type: "success", message: "✅ Payment completed successfully." });
    } else if (status === "cancel") {
      setAlert({ type: "error", message: "❌ Payment was cancelled." });
    }
  }, [location.search]);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setAlert({ type: null, message: "" });

    try {
      // 1️⃣ Save a pending payment record
   const paymentRef = await addDoc(
  collection(db, "registrations", regId, "payments"),
  {
    parentId: user.uid,
    parentEmail: user.email,
    regId,
    purpose,
    amount: purpose === "registration" ? 1000 : customAmount || null,
    itemName,
    status: "initiated",
    createdAt: serverTimestamp(),
  }
);

      // 2️⃣ Call your backend to get PayFast redirect URL
      const res = await fetch("/api/payfast-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          amount: customAmount,
          itemName,
          regId,
          parentId: user.uid,
          parentEmail: user.email,
          paymentId: paymentRef.id, // so backend can update this record
        }),
      });

      if (!res.ok) throw new Error("Failed to initiate payment");

      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch (err: any) {
      setAlert({ type: "error", message: `⚠️ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 border rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">Payments</h2>

      {alert.type && (
        <div
          className={`p-3 mb-4 rounded ${
            alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <form onSubmit={handlePayment} className="space-y-4">
        {/* Purpose */}
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

        {/* Amount for donation/event/other */}
        {(purpose === "donation" || purpose === "event" || purpose === "other") && (
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

        {/* Item name */}
        <div>
          <label className="block mb-1 font-medium">Item Name (optional)</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="e.g. Term 1 Fees"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/parent-dashboard")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Redirecting..." : "Pay Now"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentsSection;
