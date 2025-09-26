import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParentRegistration } from "../ParentRegistration";


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
    if (!user?.email) return;
    const q = query(
      collection(db, "registrations"),
      where("submittedBy", "==", user.email)
    );
    const snap = await getDocs(q);
    const list: Registration[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Registration, "id">),
    }));
    setRegistrations(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user, showForm]);

  const handleUpdate = async (id: string) => {
    await updateDoc(doc(db, "registrations", id), {
      status: "updated",
    });
    alert("Registration updated!");
    fetchRegistrations();
  };

  const handleCancel = async (id: string) => {
    await deleteDoc(doc(db, "registrations", id));
    alert("Registration cancelled!");
    fetchRegistrations();
  };

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
              {r.learnerData.grade} <br />
              <span className="text-sm text-gray-600">
                Status: {r.status} | Payment:{" "}
                {r.paymentReceived ? "✅ Paid" : "⏳ Pending"}
              </span>
            </div>
            <div className="space-x-2">
              <button
                className="px-2 py-1 bg-yellow-500 text-white rounded"
                onClick={() => handleUpdate(r.id)}
              >
                Update
              </button>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleCancel(r.id)}
              >
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
