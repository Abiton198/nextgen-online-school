"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PaymentsSection() {
  const { user } = useAuth();

  const [purpose, setPurpose] = useState<"registration" | "fees" | "donation" | "event" | "other">("fees");
  const [amount, setAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user?.uid) {
      alert("Please sign in first.");
      return;
    }

    setLoading(true);
    try {
      // 1) create a registration/payment doc you own (parentId == uid)
      const regRef = await addDoc(collection(db, "registrations"), {
        parentId: user.uid,
        submittedBy: user.email || null,
        purpose,
        customAmount: amount ? Number(amount) : null,
        itemName: customName || null,
        status: "payment_pending",
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      // 2) ask server for PayFast redirect URL
      const resp = await fetch("/.netlify/functions/payfast-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          customAmount: amount || undefined,
          itemName: customName || undefined,
          regId: regRef.id,
          parent: {
            firstName: user.displayName?.split(" ")[0] || "Parent",
            lastName: user.displayName?.split(" ").slice(1).join(" ") || "User",
            email: user.email || "",
          },
        }),
      });

      if (!resp.ok) throw new Error("Failed to initiate PayFast");
      const { redirectUrl } = await resp.json();

      // 3) redirect to PayFast
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      alert("Could not start payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Fee card */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h2 className="font-semibold text-gray-800 mb-2">Current School Fees Structure</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>Registration Fee: R1000.00</li>
          <li>Tuition Fees: R2850.00</li>
          <li>Event Ticket (average): R250.00</li>
          <li>Donation: Any amount</li>
        </ul>
      </div>

      {/* Form */}
      <div className="border rounded-lg p-4 bg-white space-y-4">
        <h3 className="font-semibold text-gray-800">Make a Payment</h3>

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

        <div>
          <label className="block text-sm text-gray-600">
            Amount (ZAR) {purpose !== "registration" && purpose !== "fees" && "(required)"}
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Enter custom amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            required={purpose !== "registration" && purpose !== "fees"}
          />
        </div>

        {(purpose === "other" || purpose === "event" || purpose === "donation") && (
          <div>
            <label className="block text-sm text-gray-600">Item Name (optional)</label>
            <input
              type="text"
              placeholder="E.g., Science Fair Donation"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold py-2 rounded`}
        >
          {loading ? "Processing..." : "Checkout with PayFast"}
        </button>
      </div>
    </div>
  );
}
