"use client";

import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PaymentsSection() {
  const { user } = useAuth();

  const [purpose, setPurpose] = useState<
    "registration" | "fees" | "donation" | "event" | "other"
  >("fees");
  const [amount, setAmount] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fixed fee mapping
  const fixedAmounts: Record<string, string> = {
    registration: "1000.00",
    fees: "2850.00",
  };

  const fixedNames: Record<string, string> = {
    registration: "Registration Fee",
    fees: "Tuition Fees",
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // 1. Resolve correct amount + item name
      let finalAmount: string;
      let itemName: string;

      if (purpose === "registration" || purpose === "fees") {
        finalAmount = fixedAmounts[purpose];
        itemName = fixedNames[purpose];
      } else {
        if (!amount) {
          alert("Please enter an amount for this payment type.");
          setLoading(false);
          return;
        }
        finalAmount = parseFloat(amount).toFixed(2);
        itemName = customName || purpose.charAt(0).toUpperCase() + purpose.slice(1);
      }

      // 2. Create a Firestore payment record
      const regRef = await addDoc(collection(db, "registrations"), {
        parentId: user?.uid,
        submittedBy: user?.email,
        purpose,
        amount: finalAmount,
        itemName,
        status: "payment_pending", // consistent with flow
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      // 3. Call backend API to get PayFast redirect URL
      const res = await fetch("/api/payfast-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          amount: finalAmount,
          itemName,
          regId: regRef.id, // Firestore doc ID
          parent: {
            firstName: user?.displayName?.split(" ")[0] || "Parent",
            lastName: user?.displayName?.split(" ")[1] || "User",
            email: user?.email || "parent@example.com",
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to initiate PayFast");

      const { redirectUrl } = await res.json();

      // 4. Redirect parent to PayFast
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      alert("Could not start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Card showing current fixed fees */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h2 className="font-semibold text-gray-800 mb-2">
          Current School Fees Structure
        </h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>Registration Fee: R1000.00</li>
          <li>Tuition Fees: R2850.00</li>
          <li>Event Ticket (average): R250.00</li>
          <li>Donation: Any amount</li>
        </ul>
      </div>

      {/* Payment form */}
      <div className="border rounded-lg p-4 bg-white space-y-4">
        <h3 className="font-semibold text-gray-800">Make a Payment</h3>

        {/* Dropdown */}
        <div>
          <label className="block text-sm text-gray-600">Payment Type</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as any)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="registration">Registration</option>
            <option value="fees">Tuition Fees</option>
            <option value="donation">Donation</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Amount field – only for variable types */}
        {!(purpose === "registration" || purpose === "fees") && (
          <div>
            <label className="block text-sm text-gray-600">Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded p-2 mt-1"
              required
            />
          </div>
        )}

        {/* Item name for variable payments */}
        {(purpose === "other" || purpose === "event" || purpose === "donation") && (
          <div>
            <label className="block text-sm text-gray-600">Item Name</label>
            <input
              type="text"
              placeholder="E.g., Science Fair Donation"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
        )}

        {/* Checkout */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-semibold py-2 rounded`}
        >
          {loading ? "Processing..." : "Checkout with PayFast"}
        </button>
      </div>
    </div>
  );
}
