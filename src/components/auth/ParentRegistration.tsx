"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const ParentRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // 🔑 logged-in parent

  const [parentName, setParentName] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [learnerGrade, setLearnerGrade] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🚨 Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!declarationAccepted) {
      alert("Please agree to the terms and conditions before submitting.");
      return;
    }

    if (!currentUser) return; // safety check

    setLoading(true);
    try {
      const parentRef = doc(db, "parents", currentUser.uid);

      const [firstName, ...rest] = learnerName.trim().split(" ");
      const lastName = rest.join(" ") || "-";

      // Save parent record
   // Save parent record
await setDoc(
  parentRef,
  {
    uid: currentUser.uid,
    email: currentUser.email,
    parentName: parentName || "Unknown",
    learnerData: {
      firstName: firstName || "Unknown",
      lastName,
      grade: learnerGrade || "-",
    },
    applicationStatus: "submitted",
    agreedToStandards: true,
    status: "active",              // 👈 mark parent as active
    createdAt: serverTimestamp(),
  },
  { merge: true }
);


      // Create student applicant record
      const studentRef = doc(db, "students", currentUser.uid);
      await setDoc(studentRef, {
        uid: currentUser.uid,
        firstName: firstName || "Unknown",
        lastName,
        grade: learnerGrade || "-",
        parentEmail: currentUser.email,
        parentName: parentName || "Unknown",
        applicationStatus: "pending",
        principalReviewed: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Parent & student records saved. Redirecting…");

      navigate("/parent-dashboard");
    } catch (err) {
      console.error("❌ Error saving registration:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 text-center text-gray-700">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white border rounded-lg shadow">
      <h2 className="text-2xl font-bold">Parent & Learner Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent Info */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Parent Information</h3>
          <p className="text-sm text-gray-600 mb-2">
            Logged in as: <b>{currentUser?.email}</b>
          </p>
          <Label>Full Name</Label>
          <Input
            type="text"
            required
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
        </div>

        {/* Learner Info */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Learner Information</h3>
          <Label>Full Name</Label>
          <Input
            type="text"
            required
            value={learnerName}
            onChange={(e) => setLearnerName(e.target.value)}
          />
          <Label className="mt-3">Grade</Label>
          <Input
            type="text"
            required
            value={learnerGrade}
            onChange={(e) => setLearnerGrade(e.target.value)}
          />
        </div>

        {/* Online Class Requirements */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold mb-3">Online Class Requirements</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Stable internet connection</li>
            <li>Computer or laptop with a working camera</li>
            <li>Quiet and controlled background (no disruptions)</li>
            <li>Headphones or speakers for clear audio</li>
            <li>Updated browser (Chrome/Firefox/Edge recommended)</li>
            <li>A dedicated study space free from distractions</li>
          </ul>
        </div>

        {/* Declaration */}
        <div className="border rounded-lg p-6 bg-red-50">
          <Label className="font-semibold">Declaration</Label>
          <label className="flex items-center gap-2 mt-2 text-sm">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="w-4 h-4"
            />
            I agree to the terms and conditions of the school standards and
            confirm all information is valid.
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !declarationAccepted}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParentRegistration;
