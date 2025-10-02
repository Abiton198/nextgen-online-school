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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeacherApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    contact: "",
    address: "",
    province: "",
    country: "",
    postalCode: "",
    subject: "",
    experience: "",
    previousSchool: "",
    ref1Name: "",
    ref1Contact: "",
    ref2Name: "",
    ref2Contact: "",
  });

  const [documents, setDocuments] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDocuments(e.target.files);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!user) throw new Error("You must be logged in to apply.");

      // Step 1: Save Firestore doc
      const docRef = await addDoc(collection(db, "teacherApplications"), {
        uid: user.uid,
        ...form,
        references: [
          { name: form.ref1Name, contact: form.ref1Contact },
          { name: form.ref2Name, contact: form.ref2Contact },
        ],
        complianceDocs: [],
        status: "pending_review",
        principalReviewed: false,
        classActivated: false, // 🚀 access controlled by principal approval
        createdAt: serverTimestamp(),
      });

      // Step 2: Upload documents to Storage
      const docUrls: string[] = [];
      if (documents) {
        for (const file of Array.from(documents)) {
          const storageRef = ref(
            storage,
            `teacherApplications/${user.uid}/${docRef.id}/documents/${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          docUrls.push(url);
        }
      }

      // Step 3: Update doc with file URLs
      if (docUrls.length > 0) {
        await updateDoc(doc(db, "teacherApplications", docRef.id), {
          complianceDocs: docUrls,
        });
      }

      setSuccessId(docRef.id);
    } catch (err: any) {
      console.error("❌ Teacher application failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <CardTitle className="text-xl">Teacher Application</CardTitle>
          <div className="w-10" />
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!successId ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Info */}
              <div>
                <Label>First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Input
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  type="tel"
                  value={form.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                />
              </div>

              {/* Address */}
              <div>
                <Label>Full Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Province</Label>
                <Input
                  value={form.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>

              {/* Teaching Info */}
              <div>
                <Label>Subject to Teach</Label>
                <select
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physical Sciences">Physical Sciences</option>
                  <option value="Life Sciences">Life Sciences</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Engineering Graphics & Design">
                    Engineering Graphics & Design
                  </option>
                  <option value="Computer Applications Technology">
                    Computer Applications Technology
                  </option>
                </select>
              </div>
              <div>
                <Label>Teaching Experience</Label>
                <Input
                  value={form.experience}
                  onChange={(e) => handleChange("experience", e.target.value)}
                  placeholder="e.g. 5 years"
                />
              </div>
              <div>
                <Label>Previous School</Label>
                <Input
                  value={form.previousSchool}
                  onChange={(e) => handleChange("previousSchool", e.target.value)}
                />
              </div>

              {/* References */}
              <div>
                <Label>Reference 1 Name</Label>
                <Input
                  value={form.ref1Name}
                  onChange={(e) => handleChange("ref1Name", e.target.value)}
                />
              </div>
              <div>
                <Label>Reference 1 Contact</Label>
                <Input
                  type="tel"
                  value={form.ref1Contact}
                  onChange={(e) => handleChange("ref1Contact", e.target.value)}
                />
              </div>
              <div>
                <Label>Reference 2 Name</Label>
                <Input
                  value={form.ref2Name}
                  onChange={(e) => handleChange("ref2Name", e.target.value)}
                />
              </div>
              <div>
                <Label>Reference 2 Contact</Label>
                <Input
                  type="tel"
                  value={form.ref2Contact}
                  onChange={(e) => handleChange("ref2Contact", e.target.value)}
                />
              </div>

              {/* Compliance Docs */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
                  <li>Copy of ID / Passport</li>
                  <li>Teaching Qualification Certificates</li>
                  <li>Proof of Address</li>
                  <li>Police Clearance or Background Check</li>
                  <li>CV (Curriculum Vitae)</li>
                </ul>
                <Input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          ) : (
            <div className="p-6 bg-green-50 border rounded-lg">
              <h3 className="text-lg font-semibold">Application Submitted!</h3>
              <p className="mt-2 text-sm text-gray-700">
                Your application ID is: <strong>{successId}</strong>. <br />
                The principal will review your application. Once approved, your class access will be activated in the dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
