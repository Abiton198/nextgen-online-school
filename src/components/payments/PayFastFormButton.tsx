"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";   // adjust path to your firebase config

interface Registration {
  id: string;
  purpose: string;
  amount: string;
  parent: { firstName: string; lastName: string; email: string };
}

export default function PayFastFormButton({ regId }: { regId: string }) {
  const [reg, setReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  // load registration details (for display only)
  useEffect(() => {
    async function fetchRegistration() {
      const ref = doc(db, "registrations", regId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setReg({
          id: regId,
          purpose: data.purpose || "Payment",
          amount: data.amount || "0.00",
          parent: data.parent || { firstName: "", lastName: "", email: "" },
        });
      }
      setLoading(false);
    }
    fetchRegistration();
  }, [regId]);

  async function handlePay() {
    try {
      const res = await fetch("/.netlify/functions/payfast-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regId }), // 👈 only send regId
      });

      if (!res.ok) throw new Error("Failed to initiate payment");
      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      alert("Something went wrong with payment. Please try again.");
    }
  }

  if (loading) return <p>Loading payment details...</p>;
  if (!reg) return <p>No registration found.</p>;

  return (
    <div className="border rounded p-4 bg-white space-y-4">
      <p><strong>Payment for:</strong> {reg.purpose}</p>
      <p><strong>Amount:</strong> R {reg.amount}</p>
      <p>
        <strong>Parent:</strong> {reg.parent.firstName} {reg.parent.lastName} ({reg.parent.email})
      </p>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePay}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          <img
            src="https://my.payfast.io/images/buttons/PayNow/Primary-Large-PayNow.png"
            alt="Pay Now"
          />
        </button>
      </div>
    </div>
  );
}
