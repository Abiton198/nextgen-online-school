"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import ParentRegistration from "../ParentRegistration";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";

// 🔹 Registration type
interface Registration {
  id: string;
  learnerData?: {
    firstName?: string;
    lastName?: string;
    grade?: string;
  };
  status: string;
  paymentReceived?: boolean;
}

export default function RegistrationSection() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // 🔎 Fetch all children registered by this parent
  const fetchRegistrations = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "registrations"),
        where("parentId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list: Registration[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Registration, "id">),
      }));
      setRegistrations(list);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user, showForm]); // re-fetch when form closes

  // 🔹 Show loading state
  if (loading) return <p className="p-4">Loading...</p>;

  // 🔹 Show ParentRegistration form
  if (showForm && user?.uid) {
    return (
      <ParentRegistration
        parentId={user.uid}
        onBack={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* 🔝 Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-2 py-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => navigate("/parent-dashboard")}
          className="text-gray-600 hover:text-red-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* ➕ Add New Child Button */}
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowForm(true)}
      >
        ➕ Register New Child
      </button>

      {/* List of registered children */}
      <ul className="mt-4 space-y-3">
        {registrations.length === 0 && (
          <p className="text-gray-600">No children registered yet.</p>
        )}

        {registrations.map((r) => {
          const firstName = r.learnerData?.firstName || "Unknown";
          const lastName = r.learnerData?.lastName || "";
          const grade = r.learnerData?.grade || "-";

          return (
            <li
              key={r.id}
              className="p-3 border rounded bg-white shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {firstName} {lastName} – Grade {grade}
                </p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={
                      r.status === "enrolled"
                        ? "text-green-600 font-medium"
                        : "text-yellow-600 font-medium"
                    }
                  >
                    {r.status}
                  </span>{" "}
                  | Payment:{" "}
                  {r.paymentReceived ? (
                    <span className="text-green-600 font-medium">✅ Paid</span>
                  ) : (
                    <span className="text-red-600 font-medium">⏳ Pending</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
