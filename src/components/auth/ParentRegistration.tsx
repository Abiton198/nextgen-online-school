import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ParentRegistration = () => {
  const [formData, setFormData] = useState({
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    studentFirstName: "",
    studentLastName: "",
    grade: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ Create parent
      const parentRef = await addDoc(collection(db, "parents"), {
        firstName: formData.parentFirstName,
        lastName: formData.parentLastName,
        email: formData.parentEmail,
        createdAt: serverTimestamp(),
      });

      // ✅ Create registration (but NOT student yet)
      const regRef = await addDoc(collection(db, "registrations"), {
        parentId: parentRef.id,
        studentInfo: {
          firstName: formData.studentFirstName,
          lastName: formData.studentLastName,
          grade: formData.grade,
        },
        status: "payment_pending",
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      // 🚀 Redirect parent to payment
      navigate(`/payments/${regRef.id}`);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Could not register. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Parent Registration</h2>

      <input
        type="text"
        name="parentFirstName"
        placeholder="Parent First Name"
        value={formData.parentFirstName}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="parentLastName"
        placeholder="Parent Last Name"
        value={formData.parentLastName}
        onChange={handleChange}
        required
      />

      <input
        type="email"
        name="parentEmail"
        placeholder="Parent Email"
        value={formData.parentEmail}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="studentFirstName"
        placeholder="Student First Name"
        value={formData.studentFirstName}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="studentLastName"
        placeholder="Student Last Name"
        value={formData.studentLastName}
        onChange={handleChange}
        required
      />

      <select
        name="grade"
        value={formData.grade}
        onChange={handleChange}
        required
      >
        <option value="">Select Grade</option>
        <option value="Grade 1">Grade 1</option>
        <option value="Grade 2">Grade 2</option>
        {/* add more grades */}
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Register & Proceed to Payment
      </button>
    </form>
  );
};

export default ParentRegistration;
