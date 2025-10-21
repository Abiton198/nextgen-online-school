import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // make sure this points to your Firestore init

export default function PaymentsSection() {
  const { user } = useAuth();

  // ✅ Env variables (using VITE_ for frontend access)
  const payfastMode = import.meta.env.VITE_PAYFAST_MODE;
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
  const siteUrl = import.meta.env.VITE_SITE_URL;

  // ✅ Correct endpoint
  const payfastUrl =
    payfastMode === "live"
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [purpose, setPurpose] = useState("registration");
  const [customAmount, setCustomAmount] = useState("");

  // 🔍 Load students linked to this parent
  useEffect(() => {
    if (!user?.uid) return;

    const loadStudents = async () => {
      try {
        const q = query(
          collection(db, "students"),
          where("parentId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStudents(list);
        console.log("📚 Found students:", list);
      } catch (err) {
        console.error("❌ Error loading students:", err);
      }
    };

    loadStudents();
  }, [user?.uid]);

  // 💰 Compute amount
  const amount =
    purpose === "registration"
      ? "1000.00"
      : (Number(customAmount) || 0).toFixed(2);

  // 🎯 Build item name for PayFast
  const selected =
    students.find((s) => s.id === selectedStudent) || {};
  const itemName = selected.firstName
    ? `${selected.firstName} ${selected.lastName} - Grade ${selected.grade} | ${purpose}`
    : "Payment";

  // 🔗 Return URLs
  const returnUrl = `${siteUrl}/parent/payments?status=success`;
  const cancelUrl = `${siteUrl}/parent/payments?status=cancel`;
  const notifyUrl = `${siteUrl}/.netlify/functions/payfast-notify`;

  return (
    <div className="p-6 border rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">💳 Student Payments</h2>

      <form
        action={payfastUrl}
        method="post"
        target="_top"
        className="space-y-4"
      >
        {/* Hidden PayFast required fields */}
        <input type="hidden" name="merchant_id" value={merchantId} />
        <input type="hidden" name="merchant_key" value={merchantKey} />
        <input type="hidden" name="return_url" value={returnUrl} />
        <input type="hidden" name="cancel_url" value={cancelUrl} />
        <input type="hidden" name="notify_url" value={notifyUrl} />

        <input
          type="hidden"
          name="name_first"
          value={user?.displayName || "Parent"}
        />
        <input
          type="hidden"
          name="email_address"
          value={user?.email || "parent@example.com"}
        />

        {/* Use student ID as m_payment_id */}
        <input
          type="hidden"
          name="m_payment_id"
          value={selectedStudent || ""}
        />
        <input type="hidden" name="item_name" value={itemName} />
        <input type="hidden" name="amount" value={amount} />

        {/* 👨‍🎓 Student selector */}
        <div>
          <label className="block mb-1 font-medium">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">-- Choose student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} - Grade {s.grade}
              </option>
            ))}
          </select>
        </div>

        {/* 🧾 Purpose selector */}
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

        {/* 💸 Custom amount for flexible types */}
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

        {/* 💰 Summary preview */}
        {selectedStudent && (
          <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700">
            Paying for:{" "}
            <strong>
              {selected.firstName} {selected.lastName} (Grade{" "}
              {selected.grade})
            </strong>
            <br />
            Purpose: <strong>{purpose}</strong>
            <br />
            Amount: <strong>R{amount}</strong>
          </div>
        )}

        {/* 🚀 Submit */}
        <button
          type="submit"
          disabled={!selectedStudent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full disabled:opacity-60"
        >
          Proceed to PayFast
        </button>
      </form>
    </div>
  );
}
