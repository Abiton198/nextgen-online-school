"use client";

import React, { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ParentRegistration() {
  const { user } = useAuth();

  // Form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [learnerGrade, setLearnerGrade] = useState("");
  const [documents, setDocuments] = useState<FileList | null>(null);

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successRegId, setSuccessRegId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const [firstName, ...rest] = learnerName.trim().split(" ");
      const lastName = rest.join(" ") || "-";

      // Step 1: Create Firestore doc first (without documents)
      const docRef = await addDoc(collection(db, "registrations"), {
        parentId: user.uid,
        parentData: {
          name: parentName || "Unknown",
          email: parentEmail || user.email || "-",
        },
        learnerData: {
          firstName: firstName || "Unknown",
          lastName,
          grade: learnerGrade || "-",
        },
        complianceDocs: [], // will be updated after upload
        status: "pending_review", // waiting for principal approval
        principalReviewed: false,
        createdAt: serverTimestamp(),
      });

      // Step 2: Upload documents to Firebase Storage inside this registration folder
      const docUrls: string[] = [];
      if (documents) {
        for (const file of Array.from(documents)) {
          const storageRef = ref(
            storage,
            `registrations/${user.uid}/${docRef.id}/documents/${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          docUrls.push(url);
        }
      }

      // Step 3: Update Firestore doc with uploaded document URLs
      if (docUrls.length > 0) {
        await updateDoc(doc(db, "registrations", docRef.id), {
          complianceDocs: docUrls,
        });
      }

      setSuccessRegId(docRef.id);
    } catch (err) {
      console.error("Error saving registration:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Parent & Learner Registration</h2>

      {!successRegId ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Info */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Parent Information</h3>
            <Label>Name</Label>
            <Input
              type="text"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />

            <Label className="mt-3">Email</Label>
            <Input
              type="email"
              required
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
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

          {/* Upload Compliance Docs */}
          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
            <p className="text-sm text-gray-600 mb-2">
              Please upload the following documents:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-3">
              <li>Copy of Parent/Guardian ID</li>
              <li>Learner’s Birth Certificate</li>
              <li>Proof of Address</li>
              <li>Learner’s Previous Report (if applicable)</li>
              <li>Medical Information (allergies, conditions)</li>
            </ul>
            <Input type="file" multiple onChange={handleFileChange} />
          </div>

          {/* Requirements & Fees */}
          <div className="border rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold mb-2">Enrolment Requirements</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Stable internet connection</li>
              <li>Computer with at least Intel Core i5, 4GB RAM, 240GB SSD</li>
              <li>Working camera for online classes</li>
              <li>Ability to set up a monthly stop-order for tuition fees</li>
              <li>
                <span className="font-medium">Registration Fee:</span> R500 (once-off, non-refundable)
              </li>
              <li>
                <span className="font-medium">Tuition Fees:</span> R2000 per month
              </li>
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
              I confirm that all provided information and documents are valid, and I accept
              the school’s enrolment requirements and fee obligations.
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !declarationAccepted}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      ) : (
        <div className="p-6 bg-green-50 border rounded-lg">
          <h3 className="text-lg font-semibold">Application Submitted!</h3>
          <p className="mt-2 text-sm text-gray-700">
            Your application ID is: <strong>{successRegId}</strong>. <br />
            The principal will review your application and notify you once your child is enrolled.
          </p>
        </div>
      )}
    </div>
  );
}
