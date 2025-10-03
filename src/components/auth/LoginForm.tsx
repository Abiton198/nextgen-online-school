"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// UI components
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

const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, resetPassword, register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<
    "student" | "teacher" | "parent" | "principal"
  >("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Ensure parent profile exists ---
  const ensureParentDoc = async (uid: string, email: string) => {
    const parentRef = doc(db, "parents", uid);
    const snap = await getDoc(parentRef);

    if (!snap.exists()) {
      await setDoc(parentRef, {
        uid,
        email,
        firstName: "",
        lastName: "",
        title: "",
        createdAt: serverTimestamp(),
        children: [],
        applicationStatus: "pending_registration", // track onboarding
      });
    }
  };

  // --- Login existing user ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (!user) throw new Error("Login failed");

      if (role === "parent") {
        // If parent already has doc, go to dashboard
        navigate("/parent-dashboard");
      }
      if (role === "student") navigate("/student-dashboard");
      if (role === "teacher") navigate("/teacher-dashboard");
      if (role === "principal") navigate("/principal-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Signup new parent ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await register(email, password);
      if (!user) throw new Error("Signup failed");

      if (role === "parent") {
        await ensureParentDoc(user.uid, user.email);
        // Redirect parent immediately to registration flow
        navigate("/register");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google Sign-In ---
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (!loggedUser) throw new Error("Google login failed");

      if (role === "parent") {
        await ensureParentDoc(loggedUser.uid, loggedUser.email);
        navigate("/register"); // redirect to application process
      }
      if (role === "teacher") navigate("/teacher-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Reset Password ---
  const handleResetPassword = async () => {
    if (!email) return setError("Enter your email first.");
    try {
      await resetPassword(email);
      alert("Password reset email sent.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto" />
          <CardTitle>Sign In / Sign Up</CardTitle>
          <CardDescription>Access your dashboard or start your application</CardDescription>
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

            {/* Email */}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

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

            {/* Sign In */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Processing..." : "Sign In"}
            </Button>

            {/* Sign Up (for parent only) */}
            {role === "parent" && (
              <Button
                type="button"
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                {isLoading ? "Creating..." : "Sign Up as Parent"}
              </Button>
            )}

            {/* Reset Password */}
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Forgot password?
            </button>

            {/* Google Sign-In (parent or teacher) */}
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
