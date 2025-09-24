// src/components/auth/LoginForm.tsx
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
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const LoginForm: React.FC = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"principal" | "teacher" | "parent">("parent");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  // ---------------- Fetch teacher subjects ----------------
  useEffect(() => {
    if (role === "teacher") {
      const fetchSubjects = async () => {
        const q = collection(db, "teachers");
        const snapshot = await getDocs(q);
        const subs: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.subject && !subs.includes(data.subject)) {
            subs.push(data.subject);
          }
        });
        setSubjects(subs);
      };
      fetchSubjects();
    }
  }, [role]);

  // ---------------- Helper: Unified Registration ----------------
  const registerUser = async (
    uid: string,
    email: string,
    name: string,
    role: "principal" | "teacher" | "parent",
    extra: any = {}
  ) => {
    if (role === "principal") {
      throw new Error("Principals cannot self-register. Contact admin.");
    }

    if (role === "parent") {
      await setDoc(doc(db, "parents", uid), {
        uid,
        email,
        name,
        role: "parent",
        createdAt: new Date().toISOString(),
        ...extra,
      });
      navigate("/parent-dashboard");
    }

    if (role === "teacher") {
      await setDoc(doc(db, "pendingTeachers", uid), {
        uid,
        email,
        name,
        role: "teacher",
        subject: extra.subject || null,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      alert("Your registration is pending approval by the principal.");
      navigate("/"); // back to login
    }
  };

  // ---------------- Email/Password Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const cred = await login(email, password);
      const uid = cred.user.uid;

      if (role === "teacher") {
        const approvedSnap = await getDoc(doc(db, "teachers", uid));
        const pendingSnap = await getDoc(doc(db, "pendingTeachers", uid));

        if (approvedSnap.exists()) {
          navigate("/teacher-dashboard");
        } else if (pendingSnap.exists()) {
          throw new Error("Your teacher account is still pending approval.");
        } else {
          throw new Error("No teacher record found.");
        }
      } else {
        const snap = await getDoc(doc(db, `${role}s`, uid));
        if (!snap.exists()) {
          throw new Error(`No ${role} record found. Contact admin.`);
        }
        navigate(`/${role}-dashboard`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Signup ----------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const cred = await signup({ email, password });
      await registerUser(cred.uid, email, name, role, {
        subject: selectedSubject,
      });
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
      const uid = loggedUser.uid;

      // 🔎 Check if already approved in Firestore
      let foundRole: string | null = null;
      for (const r of ["principals", "teachers", "parents"]) {
        const snap = await getDoc(doc(db, r, uid));
        if (snap.exists()) {
          foundRole = snap.data().role;
          break;
        }
      }

      if (!foundRole) {
        // Not found → register in correct place
        await registerUser(
          uid,
          loggedUser.email!,
          loggedUser.displayName || name || "",
          role,
          { subject: selectedSubject }
        );
        return;
      }

      navigate(`/${foundRole}-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              NextGen Independent Online (CAPS) High School
            </span>
          </div>
          <CardTitle className="text-xl">
            {isSignup ? "Sign Up" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? "Create your account"
              : "Sign in to access your dashboard"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={isSignup ? handleSignup : handleLogin}
            className="space-y-4"
          >
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Select Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="principal">Principal</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Teacher Extra Fields */}
            {role === "teacher" && isSignup && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email & Password */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Parent Signup Extra Fields */}
            {isSignup && role === "parent" && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignup
                    ? "Signing Up..."
                    : "Signing In..."
                  : isSignup
                  ? "Sign Up"
                  : "Sign In"}
              </Button>

              {!isSignup && (
                <Button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <FcGoogle className="w-5 h-5" />
                  Google
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              {isSignup ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600"
                    onClick={() => setIsSignup(false)}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600"
                    onClick={() => setIsSignup(true)}
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
