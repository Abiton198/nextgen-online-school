"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FcGoogle } from "react-icons/fc";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const STORAGE_KEY = "teacherApplicationDraft";

const TeacherApplicationForm: React.FC = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // --- Form State ---
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    province: "",
    country: "",
    postalCode: "",
    address: "",
    contact: "",
    subject: "",
    experience: "",
    previousSchool: "",
    ref1Name: "",
    ref1Contact: "",
    ref2Name: "",
    ref2Contact: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Load draft from localStorage ----
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) setForm(JSON.parse(draft));
  }, []);

  // ---- Auto-save to localStorage ----
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  // ---- Input Handler ----
  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ---- Submit Application (Email/Password) ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // ✅ Step 1: Sign up user (returns user directly from AuthProvider)
      const user = await signup(form.email, form.password);
      const uid = user.uid;

      // ✅ Step 2: Write only allowed fields
      await setDoc(doc(db, "pendingTeachers", uid), {
        uid,
        ...form,
        references: [
          { name: form.ref1Name, contact: form.ref1Contact },
          { name: form.ref2Name, contact: form.ref2Contact },
        ],
        applicationStage: "uploading-docs",
        createdAt: serverTimestamp(),
      });

      // ✅ Step 3: Clean up + navigate
      localStorage.removeItem(STORAGE_KEY);
      alert("✅ Application submitted! Please upload your supporting documents.");
      navigate("/upload-teacher-docs");
    } catch (err: any) {
      console.error("❌ Teacher application failed:", err.code, err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Google Signup ----
  const handleGoogleSignup = async () => {
    setError("");
    setIsLoading(true);

    try {
      const user = await loginWithGoogle();
      if (user) {
        await setDoc(doc(db, "pendingTeachers", user.uid), {
          uid: user.uid,
          email: user.email,
          ...form,
          references: [
            { name: form.ref1Name, contact: form.ref1Contact },
            { name: form.ref2Name, contact: form.ref2Contact },
          ],
          applicationStage: "uploading-docs",
          createdAt: serverTimestamp(),
        });

        localStorage.removeItem(STORAGE_KEY);
        alert("✅ Application submitted via Google! Please upload your documents.");
        navigate("/upload-teacher-docs");
      }
    } catch (err: any) {
      console.error("❌ Google teacher application failed:", err.code, err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Render ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-screen overflow-y-auto">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address fields */}
            <div>
              <Label>Full Address</Label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter your address"
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

            {/* Personal Info */}
            <div>
              <Label>First Name</Label>
              <Input
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                autoComplete="family-name"
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
                placeholder="Male / Female / Other"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                type="tel"
                autoComplete="tel"
                value={form.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
              />
            </div>

            {/* Subject Dropdown */}
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

            {/* Professional Info */}
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

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Google Signup */}
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-100"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <FcGoogle className="w-5 h-5" />
              Apply with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApplicationForm;
