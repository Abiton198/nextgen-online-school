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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [subject, setSubject] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Signup with Email/Password ----
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
        contact,
        address,
        subject,
        role: "teacher",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("✅ Application submitted! A principal will review your request.");
      navigate("/");
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
        contact: "",
        address: "",
        subject,
        role: "teacher",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("✅ Application submitted via Google! Pending principal approval.");
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
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
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Subject to Teach</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
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
