"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"student" | "teacher" | "parent" | "principal">("parent");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Dropdown state ---
  const [grade, setGrade] = useState("");
  const [studentName, setStudentName] = useState("");
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // 🔹 Fetch students for selected grade
  useEffect(() => {
    if (role === "student" && grade) {
      (async () => {
        const q = query(
          collection(db, "registrations"),
          where("learnerData.grade", "==", grade),
          where("status", "==", "enrolled")
        );
        const snap = await getDocs(q);
        const names = snap.docs.map(
          (d) =>
            `${d.data().learnerData.firstName} ${d.data().learnerData.lastName}`
        );
        setAvailableStudents(names);
      })();
    }
  }, [role, grade]);

  // 🔹 Fetch subjects for teacher dropdown
  useEffect(() => {
    if (role === "teacher") {
      (async () => {
        const q = query(
          collection(db, "teacherApplications"),
          where("status", "==", "approved")
        );
        const snap = await getDocs(q);
        const subs = snap.docs.map((d) => d.data().subject);
        setAvailableSubjects(subs);
      })();
    }
  }, [role]);

  // ---------------- Handle Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let loginEmail = email;

      if (role === "student") {
        if (!grade || !studentName) throw new Error("Select grade and student.");
        const [firstName, lastName] = studentName.split(" ");
        const q = query(
          collection(db, "registrations"),
          where("learnerData.grade", "==", grade),
          where("learnerData.firstName", "==", firstName),
          where("learnerData.lastName", "==", lastName)
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Student not found.");
        const student = snap.docs[0].data();
        loginEmail = student.email || student.parentData?.email;
        if (!loginEmail) throw new Error("No email linked for this student.");
      }

      if (role === "teacher") {
        if (!subject) throw new Error("Select subject.");
        const q = query(
          collection(db, "teacherApplications"),
          where("subject", "==", subject),
          where("status", "==", "approved")
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Teacher not found.");
        const teacher = snap.docs[0].data();
        loginEmail = teacher.email;
      }

      // 🔑 Attempt login
      const user = await login(loginEmail, password);
      console.log("Logged in:", user.uid);

      // ✅ Navigate only after success
      if (role === "student") navigate("/student-dashboard");
      if (role === "teacher") navigate("/teacher-dashboard");
      if (role === "parent") navigate("/parent-dashboard");
      if (role === "principal") navigate("/principal-dashboard");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Google Login ----------------
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (!loggedUser) throw new Error("Google login failed");
      if (role === "teacher") navigate("/teacher-dashboard");
      if (role === "parent") navigate("/parent-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Reset Password ----------------
  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email to reset password.");
      return;
    }
    try {
      await resetPassword(email);
      alert("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto" />
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border rounded-md p-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="principal">Principal</option>
              </select>
            </div>

            {/* Student Dropdowns */}
            {role === "student" && (
              <>
                <div>
                  <Label>Grade</Label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Select Grade</option>
                    {[8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g.toString()}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                {availableStudents.length > 0 && (
                  <div>
                    <Label>Student</Label>
                    <select
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Select Student</option>
                      {availableStudents.map((s, idx) => (
                        <option key={idx} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Teacher Dropdown */}
            {role === "teacher" && (
              <div>
                <Label>Subject</Label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parent/Principal Email */}
            {(role === "parent" || role === "principal") && (
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Password */}
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Reset password only for email-based logins */}
            {(role === "parent" || role === "principal" || role === "teacher") && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                Forgot password?
              </button>
            )}

            {(role === "parent" || role === "teacher") && (
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 border border-gray-300 hover:bg-gray-100"
              >
                <FcGoogle className="w-5 h-5" /> Sign in with Google
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
