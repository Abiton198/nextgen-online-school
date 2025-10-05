"use client";

import React, { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const ParentRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // 🔑 get logged-in parent

  const [parentName, setParentName] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [learnerGrade, setLearnerGrade] = useState("");
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationAccepted || !currentUser) return;

    setLoading(true);
    try {
      const parentRef = doc(db, "parents", currentUser.uid);

      // ✏️ Split learner name
      const [firstName, ...rest] = learnerName.trim().split(" ");
      const lastName = rest.join(" ") || "-";

      // 📂 Upload documents
      const docUrls: string[] = [];
      if (documents) {
        for (const file of Array.from(documents)) {
          const storageRef = ref(
            storage,
            `parents/${currentUser.uid}/documents/${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          docUrls.push(url);
        }
      }

      // 📝 Save parent record in Firestore
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
          complianceDocs: docUrls,
          applicationStatus: "submitted",
          principalReviewed: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 🚀 Redirect straight to dashboard
      navigate("/parent-dashboard");
    } catch (err) {
      console.error("Error saving registration:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Documents */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
          <Input type="file" multiple onChange={handleFileChange} />
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
            I confirm all information is valid and I accept the school’s
            requirements.
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
