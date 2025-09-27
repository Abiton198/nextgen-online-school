"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PaymentsSection() {
  const { user } = useAuth();

  const [purpose, setPurpose] = useState<"registration" | "fees" | "donation" | "event" | "other">("fees");
  const [amount, setAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [regId, setRegId] = useState<string | null>(null);

  // 🔎 Fetch parent registrationId at mount
  useEffect(() => {
    const fetchRegId = async () => {
      if (!user?.uid) return;
      const parentRef = doc(db, "parents", user.uid);
      const snap = await getDoc(parentRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.registrationId) {
          setRegId(data.registrationId);
        }
      }
    };
    fetchRegId();
  }, [user]);

  const handleCheckout = async () => {
    if (!user?.uid) {
      alert("Please sign in first.");
      return;
    }
    if (!regId) {
      alert("No registration found for this parent.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/.netlify/functions/payfast-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regId }), // ✅ only pass regId
      });

      if (!resp.ok) throw new Error("Failed to initiate PayFast");
      const { url } = await resp.json();

      window.location.href = url;
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
          disabled={loading || !regId}
          className={`w-full ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold py-2 rounded`}
        >
          {loading ? "Processing..." : "Checkout with PayFast"}
        </button>
      </div>
    </div>
  );
}
