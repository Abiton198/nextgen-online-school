import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import ParentRegistration  from "../ParentRegistration";

interface Registration {
  id: string;
  learnerData: {
    firstName: string;
    lastName: string;
    grade: string;
  };
  status: string;
  paymentReceived?: boolean;
}

export default function RegistrationSection() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  if (showForm) {
    return <ParentRegistration onBack={() => setShowForm(false)} />;
  }

  return (
    <div>
      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowForm(true)}
      >
        ➕ Register New Child
      </button>

      <ul className="mt-4 space-y-2">
        {registrations.map((r) => (
          <li key={r.id} className="flex justify-between border-b py-2">
            <div>
              {r.learnerData.firstName} {r.learnerData.lastName} – Grade{" "}
              {r.learnerData.grade}
              <br />
              <span className="text-sm text-gray-600">
                Status: {r.status} | Payment:{" "}
                {r.paymentReceived ? "✅ Paid" : "⏳ Pending"}
              </span>
            </div>
            {/* 🔒 Parents cannot update/cancel their registrations per rules */}
          </li>
        ))}
      </ul>
    </div>
  );
}
