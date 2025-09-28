"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const TeacherApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load draft if exists
  useEffect(() => {
    const draft = localStorage.getItem("teacherApplicationDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setFirstName(parsed.firstName || "");
      setLastName(parsed.lastName || "");
      setEmail(parsed.email || "");
      setSubject(parsed.subject || "");
    }
  }, []);

  // Save draft locally
  const handleSaveDraft = () => {
    const draft = { firstName, lastName, email, subject };
    localStorage.setItem("teacherApplicationDraft", JSON.stringify(draft));
    alert("Application saved. You can continue later.");
  };

  // Submit to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to apply.");
        return;
      }

      await setDoc(doc(db, "pendingTeachers", user.uid), {
        uid: user.uid,
        email,
        name: `${firstName} ${lastName}`,
        subject,
        role: "teacher",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      localStorage.removeItem("teacherApplicationDraft");
      alert("Application submitted! Pending principal approval.");
      navigate("/");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      {/* Cancel (X) button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Return arrow */}
      <button
        onClick={() => navigate("/signup")}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teacher Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                className="flex-1"
              >
                Save & Continue Later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApplicationForm;
