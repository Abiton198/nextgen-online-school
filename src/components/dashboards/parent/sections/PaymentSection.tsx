import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function PaymentsSection() {
  const { user } = useAuth();

  // 🔹 Environment variables (use VITE_ prefix for Netlify/Vite)
  const payfastMode = import.meta.env.VITE_PAYFAST_MODE;
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
  const siteUrl = import.meta.env.VITE_SITE_URL;

  const payfastUrl =
    payfastMode === "live"
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

  // 🔹 State
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [purpose, setPurpose] = useState("registration");
  const [customAmount, setCustomAmount] = useState("");
  const [amount, setAmount] = useState("1000.00");
  const [loading, setLoading] = useState(false);

  const defaultAmounts: Record<string, string> = {
    registration: "1000.00",
    fees: "2850.00",
    donation: "100.00",
    event: "250.00",
    other: "100.00",
  };

  // 🔹 Fetch student data (e.g., from Firestore `parents/{uid}`)
  useEffect(() => {
    async function fetchStudentInfo() {
      if (!user?.uid) return;
      try {
        const profileRef = doc(db, "parents", user.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data();
          setStudentName(data.studentName || "Student");
          setStudentGrade(data.grade || "Grade Unknown");
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      }
    }
    fetchStudentInfo();
  }, [user]);

  // 🔹 Auto update amount
  useEffect(() => {
    if (["donation", "event", "other"].includes(purpose)) {
      setAmount((Number(customAmount) || 0).toFixed(2));
    } else {
      setAmount(defaultAmounts[purpose] || "0.00");
    }
  }, [purpose, customAmount]);

  // 🔹 Start payment: redirect to PayFast
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to proceed.");
    setLoading(true);

    try {
      const itemName = `${studentName} - ${studentGrade} (${purpose})`;

      const params = new URLSearchParams({
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${siteUrl}/parent/payments?status=success`,
        cancel_url: `${siteUrl}/parent/payments?status=cancel`,
        notify_url: `${siteUrl}/.netlify/functions/payfast-notify`,
        name_first: user.displayName || "Parent",
        email_address: user.email || "parent@example.com",
        m_payment_id: user.uid,
        amount: amount,
        item_name: itemName,
      });

      // Redirect to PayFast hosted checkout
      const redirectUrl = `${payfastUrl}?${params.toString()}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("Payment redirect error:", err);
      alert("Error starting payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">💳 Make a Payment</h2>

      <form onSubmit={handlePayment} className="space-y-4">
        {/* Student info */}
        <div>
          <label className="block mb-1 font-medium">Student</label>
          <div className="border rounded p-2 bg-gray-50">
            {studentName ? `${studentName} (${studentGrade})` : "Loading..."}
          </div>
        </div>

        {/* Purpose selection */}
        <div>
          <label className="block mb-1 font-medium">Select Item to Pay</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="registration">Registration Fee</option>
            <option value="fees">Tuition Fees</option>
            <option value="donation">Donation</option>
            <option value="event">Event Ticket</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Custom amount */}
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

        {/* Display calculated amount */}
        <div>
          <label className="block mb-1 font-medium">Amount to Pay</label>
          <div className="border rounded p-2 bg-gray-100 font-semibold">
            R {amount}
          </div>
        </div>

        {/* Proceed button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Redirecting..." : "💳 Proceed to PayFast"}
        </button>
      </form>
    </div>
  );
}
