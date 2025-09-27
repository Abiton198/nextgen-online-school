import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface ParentRegistrationProps {
  parentId: string;
  onBack: () => void;
}

const ParentRegistration: React.FC<ParentRegistrationProps> = ({ parentId, onBack }) => {
  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentLastName: "",
    grade: "",
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ Create registration linked to parent
      const regRef = await addDoc(collection(db, "registrations"), {
        parentId,
        learnerData: {
          firstName: formData.studentFirstName,
          lastName: formData.studentLastName,
          grade: formData.grade,
        },
        status: "payment_pending",
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      // 🚀 Redirect parent to payment page
      navigate(`/payments/${regRef.id}`);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Could not register. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded bg-white shadow">
      <h2 className="text-xl font-semibold">Register a New Student</h2>

      <input
        type="text"
        name="studentFirstName"
        placeholder="Student First Name"
        value={formData.studentFirstName}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        name="studentLastName"
        placeholder="Student Last Name"
        value={formData.studentLastName}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      />

      <select
        name="grade"
        value={formData.grade}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Grade</option>
        <option value="Grade 8">Grade 8</option>
        <option value="Grade 9">Grade 9</option>
        <option value="Grade 10">Grade 10</option>
        <option value="Grade 11">Grade 11</option>
        <option value="Grade 12">Grade 12</option>
      </select>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Register & Proceed to Payment
        </button>
      </div>
    </form>
  );
};

export default ParentRegistration;
