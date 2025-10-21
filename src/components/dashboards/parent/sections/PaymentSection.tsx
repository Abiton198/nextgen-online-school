"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function PaymentsSection() {
  const { user } = useAuth();

  // 🔹 Environment Variables
  const payfastMode = import.meta.env.VITE_PAYFAST_MODE;
  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
  const siteUrl = import.meta.env.VITE_SITE_URL;

  const payfastUrl =
    payfastMode === "live"
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

  // 🔹 State
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [purpose, setPurpose] = useState("registration");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch all students for this parent
  useEffect(() => {
    if (!user) return;

    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, "students"),
          where("parentId", "==", user.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setStudents(data);
          setSelectedStudent(data[0]); // default to first student
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  // 🔹 Compute amount
  const amount =
    purpose === "registration"
      ? "1000.00"
      : (Number(customAmount) || 0).toFixed(2);

  // 🔹 Compute item name (includes student info)
  const itemName = selectedStudent
    ? `${selectedStudent.fullName || "Student"} - Grade ${
        selectedStudent.grade || "N/A"
      } | ${purpose.toUpperCase()}`
    : purpose.toUpperCase();

  // 🔹 URLs for redirect/notify
  const returnUrl = `${siteUrl}/parent/payments?status=success`;
  const cancelUrl = `${siteUrl}/parent/payments?status=cancel`;
  const notifyUrl = `${siteUrl}/.netlify/functions/payfast-notify`;

  // 🔹 Loading state
  if (loading) {
    return <div className="p-6">Loading student info...</div>;
  }

  if (students.length === 0) {
    return (
      <div className="p-6">
        <p>No students found for this account.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">Payments</h2>

      {/* Student Selector */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Student</label>
        <select
          value={selectedStudent?.id || ""}
          onChange={(e) =>
            setSelectedStudent(
              students.find((s) => s.id === e.target.value) || null
            )
          }
          className="border rounded p-2 w-full"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} - Grade {student.grade}
            </option>
          ))}
        </select>
      </div>

      {/* Student Info */}
      {selectedStudent && (
        <div className="mb-4 p-3 bg-gray-50 border rounded">
          <p>
            <strong>Student:</strong> {selectedStudent.fullName}
          </p>
          <p>
            <strong>Grade:</strong> {selectedStudent.grade}
          </p>
        </div>
      )}

      <form action={payfastUrl} method="post" target="_top" className="space-y-4">
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
        <input
          type="hidden"
          name="m_payment_id"
          value={selectedStudent?.id || user?.uid || "guest"}
        />
        <input type="hidden" name="item_name" value={itemName} />
        <input type="hidden" name="amount" value={amount} />

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

        {/* Custom amount for donation/event/other */}
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

        {/* Display amount */}
        <div className="bg-gray-100 p-3 rounded text-lg">
          <strong>Amount to Pay:</strong> R {amount}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          💳 Pay for {selectedStudent?.fullName || "Student"}
        </button>
      </form>
    </div>
  );
}
