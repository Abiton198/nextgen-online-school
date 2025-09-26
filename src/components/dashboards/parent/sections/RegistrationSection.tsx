import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

interface Registration {
  id: string;
  learnerData: {
    firstName: string;
    lastName: string;
    grade: string;
  };
  status: string;
}

export default function RegistrationSection() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const fetchRegistrations = async () => {
      const q = query(collection(db, "registrations"), where("submittedBy", "==", user.email));
      const snap = await getDocs(q);
      const list: Registration[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Registration, "id">),
      }));
      setRegistrations(list);
      setLoading(false);
    };

    fetchRegistrations();
  }, [user]);

  const handleRegister = async () => {
    if (!user?.email) return;
    await addDoc(collection(db, "registrations"), {
      submittedBy: user.email,
      learnerData: { firstName: "New", lastName: "Child", grade: "1" },
      status: "pending",
      paymentReceived: false,
    });
    alert("New registration created!");
  };

  const handleUpdate = async (id: string) => {
    await updateDoc(doc(db, "registrations", id), {
      status: "updated",
    });
    alert("Registration updated!");
  };

  const handleCancel = async (id: string) => {
    await deleteDoc(doc(db, "registrations", id));
    alert("Registration cancelled!");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={handleRegister}
      >
        ➕ Register New Child
      </button>

      <ul className="mt-4 space-y-2">
        {registrations.map((r) => (
          <li key={r.id} className="flex justify-between border-b py-2">
            {r.learnerData.firstName} {r.learnerData.lastName} – Grade {r.learnerData.grade}
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
