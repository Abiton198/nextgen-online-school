import React, { useState } from "react";
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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"principal" | "teacher" | "parent">("parent");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---------- Parent-specific signup fields ----------
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  // ---------------- Email/Password Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (role === "student") {
        throw new Error("Students cannot log in directly. Please log in as a parent.");
      }

      if (role === "teacher") {
        const user = await login(email, password);
        const uid = user.uid;

        const approvedSnap = await getDoc(doc(db, "teachers", uid));
        const pendingSnap = await getDoc(doc(db, "pendingTeachers", uid));

        if (approvedSnap.exists()) {
          navigate("/teacher-dashboard");
        } else if (pendingSnap.exists()) {
          navigate("/teacher-status");
        } else {
          navigate("/apply-teacher");
        }
        return;
      }

      if (role === "parent") {
        const user = await login(email, password);
        const uid = user.uid;
        const snap = await getDoc(doc(db, "parents", uid));
        if (!snap.exists()) throw new Error("No parent record found.");
        navigate("/parent-dashboard");
        return;
      }

      if (role === "principal") {
        const user = await login(email, password);
        const uid = user.uid;
        const snap = await getDoc(doc(db, "principals", uid));
        if (!snap.exists()) throw new Error("No principal record found.");
        navigate("/principal-dashboard");
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

    if (role === "student") {
      setError("Students cannot self-register. Ask your parent to register.");
      return;
    }
    if (role === "principal") {
      setError("Principals cannot self-register. Contact the admin.");
      return;
    }
    if (role === "teacher") {
      navigate("/apply-teacher");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (role === "parent") {
        const user = await signup(email, password);
        const uid = user.uid;
        await setDoc(doc(db, "parents", uid), {
          uid,
          email,
          title,
          firstName,
          lastName,
          contact,
          address,
          role: "parent",
          children: [], // start empty, later filled by parent
          createdAt: serverTimestamp(),
        });
        navigate("/parent-dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Google Login/Signup ----------------
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const loggedUser = await loginWithGoogle();
      if (!loggedUser) throw new Error("Google sign-in failed");
      const uid = loggedUser.uid;

      if (role === "student") {
        throw new Error("Students cannot sign up with Google.");
      }

      if (role === "teacher") {
        const approvedSnap = await getDoc(doc(db, "teachers", uid));
        const pendingSnap = await getDoc(doc(db, "pendingTeachers", uid));

        if (approvedSnap.exists()) {
          navigate("/teacher-dashboard");
          return;
        }
        if (pendingSnap.exists()) {
          navigate("/teacher-status");
          return;
        }
        navigate("/apply-teacher");
        return;
      }

      if (role === "parent") {
        const parentSnap = await getDoc(doc(db, "parents", uid));
        if (parentSnap.exists()) {
          navigate("/parent-dashboard");
          return;
        }
        await setDoc(doc(db, "parents", uid), {
          uid,
          email: loggedUser.email!,
          title: "Mr/Mrs",
          firstName: loggedUser.displayName?.split(" ")[0] || "",
          lastName: loggedUser.displayName?.split(" ")[1] || "",
          contact: "",
          address: "",
          photoURL: loggedUser.photoURL || "",
          role: "parent",
          children: [],
          createdAt: serverTimestamp(),
        });
        navigate("/parent-dashboard");
        return;
      }

      if (role === "principal") {
        throw new Error("Principals cannot self-register. Contact admin.");
      }
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
                {/* no student option for signup/login */}
              </select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
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
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Teacher Signup Info */}
            {role === "teacher" && isSignup && (
              <div className="text-center text-sm text-gray-500">
                <p>
                  Teachers must apply via{" "}
                  <a href="/apply-teacher" className="text-blue-600 underline">
                    Teacher Application Form
                  </a>
                </p>
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
              <Button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <FcGoogle className="w-5 h-5" /> Google
              </Button>
            </div>

            {role !== "student" && (
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
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
