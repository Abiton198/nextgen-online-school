"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const TeacherApplicationForm: React.FC = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // --- Basic Auth ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Personal Info ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");

  // --- Professional Info ---
  const [experience, setExperience] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [ref1Name, setRef1Name] = useState("");
  const [ref1Contact, setRef1Contact] = useState("");
  const [ref2Name, setRef2Name] = useState("");
  const [ref2Contact, setRef2Contact] = useState("");

  // --- State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Submit Application with Email/Password ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const cred = await signup(email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "pendingTeachers", uid), {
        uid,
        email,
        firstName,
        lastName,
        gender,
        province,
        country,
        address,
        contact,
        subject,
        experience,
        previousSchool,
        references: [
          { name: ref1Name, contact: ref1Contact },
          { name: ref2Name, contact: ref2Contact },
        ],
        role: "teacher",
        status: "pending",
        applicationStage: "applied", // ✅ stage tracking
        createdAt: serverTimestamp(),
      });

      alert("✅ Application submitted! A principal will review your request.");
      navigate("/teacher-status"); // 🚀 redirect to status page
    } catch (err: any) {
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
      const uid = user.uid;

      await setDoc(doc(db, "pendingTeachers", uid), {
        uid,
        email: user.email!,
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ")[1] || "",
        gender,
        province,
        country,
        address,
        contact,
        subject,
        experience,
        previousSchool,
        references: [
          { name: ref1Name, contact: ref1Contact },
          { name: ref2Name, contact: ref2Contact },
        ],
        role: "teacher",
        status: "pending",
        applicationStage: "applied", // ✅ stage tracking
        createdAt: serverTimestamp(),
      });

      alert("✅ Application submitted via Google! Pending principal approval.");
      navigate("/teacher-status"); // 🚀 redirect to status page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-screen overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">Teacher Application</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <Label>Gender</Label>
              <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Male / Female / Other" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <Label>Province</Label>
              <Input value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <Label>Full Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Subject to Teach</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>

            {/* Professional Info */}
            <div>
              <Label>Teaching Experience</Label>
              <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 years" />
            </div>
            <div>
              <Label>Previous School</Label>
              <Input value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} />
            </div>

            {/* References */}
            <div>
              <Label>Reference 1 Name</Label>
              <Input value={ref1Name} onChange={(e) => setRef1Name(e.target.value)} />
            </div>
            <div>
              <Label>Reference 1 Contact</Label>
              <Input value={ref1Contact} onChange={(e) => setRef1Contact(e.target.value)} />
            </div>
            <div>
              <Label>Reference 2 Name</Label>
              <Input value={ref2Name} onChange={(e) => setRef2Name(e.target.value)} />
            </div>
            <div>
              <Label>Reference 2 Contact</Label>
              <Input value={ref2Contact} onChange={(e) => setRef2Contact(e.target.value)} />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>

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
