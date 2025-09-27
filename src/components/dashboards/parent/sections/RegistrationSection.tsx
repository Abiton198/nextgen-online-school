"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import ParentRegistration from "../ParentRegistration";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";

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

  const fetchRegistrations = async () => {
    if (!user?.uid) return;

    try {
      // 🔑 Parents can only query docs where parentId == uid (matches rules)
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
  }, [user, showForm]);

  if (loading) return <p>Loading...</p>;

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
      {/* 🔝 Floating Navigation Bar */}
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

      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowForm(true)}
      >
        ➕ Register New Child
      </button>

      <ul className="mt-4 space-y-2">
        {registrations.map((r) => {
          const firstName = r.learnerData?.firstName || "Unknown";
          const lastName = r.learnerData?.lastName || "";
          const grade = r.learnerData?.grade || "-";

          return (
            <li key={r.id} className="flex justify-between border-b py-2">
              <div>
                {firstName} {lastName} – Grade {grade}
                <br />
                <span className="text-sm text-gray-600">
                  Status: {r.status} | Payment:{" "}
                  {r.paymentReceived ? "✅ Paid" : "⏳ Pending"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
