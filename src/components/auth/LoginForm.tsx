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
import { signupParent, signupTeacher } from "@/lib/firebaseFunctions";

export const LoginForm: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<
    "principal" | "teacher" | "parent" | "student"
  >("parent");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---------- Student-specific ----------
  const [grades] = useState([
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // ---------- Teacher-specific ----------
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

  // ---------------- Fetch students by grade ----------------
  useEffect(() => {
    if (role === "student" && selectedGrade) {
      const fetchStudents = async () => {
        const q = collection(db, "students");
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.grade === selectedGrade) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        setStudents(list);
      };
      fetchStudents();
    }
  }, [role, selectedGrade]);

  // ---------------- Email/Password Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (role === "student") {
        if (!selectedStudentId) throw new Error("Please select your name.");
        const studentRef = doc(db, "students", selectedStudentId);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          throw new Error(
            "No student record found. Contact your parent or principal."
          );
        }

        const studentData = studentSnap.data();
        const emailToUse = studentData.email;

        const cred = await login(emailToUse, password);
        if (cred.user.uid !== selectedStudentId) {
          throw new Error("Account mismatch. Please contact your principal.");
        }

        navigate("/student-dashboard");
        return;
      }

      if (role === "teacher") {
        const cred = await login(email, password);
        const uid = cred.user.uid;
        const approvedSnap = await getDoc(doc(db, "teachers", uid));
        const pendingSnap = await getDoc(doc(db, "pendingTeachers", uid));

        if (approvedSnap.exists()) {
          navigate("/teacher-dashboard");
        } else if (pendingSnap.exists()) {
          throw new Error("Your teacher account is still pending approval.");
        } else {
          throw new Error("No teacher record found.");
        }
        return;
      }

      const cred = await login(email, password);
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, `${role}s`, uid));
      if (!snap.exists()) {
        throw new Error(`No ${role} record found. Contact admin.`);
      }
      navigate(`/${role}-dashboard`);
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
      setError("Students cannot sign up. Please ask your parent to register you.");
      return;
    }
    if (role === "principal") {
      setError("Principals cannot self-register. Contact admin.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (role === "parent") {
        await signupParent(email, password, {
          firstName: name,
          lastName: "",
        });
        navigate("/parent-dashboard");
      }

      if (role === "teacher") {
        await signupTeacher(email, password, {
          name,
          subject: selectedSubject || null,
        });
        alert("Your teacher account is pending approval by the principal.");
        navigate("/");
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
      const uid = loggedUser.uid;

      if (role === "student") {
        if (!selectedStudentId) throw new Error("Please select your name.");
        const studentRef = doc(db, "students", selectedStudentId);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          throw new Error(
            "No student record found. Contact your parent or principal."
          );
        }

        const studentData = studentSnap.data();
        if (loggedUser.email !== studentData.email) {
          throw new Error(
            "Google account mismatch. Use the email registered by your parent."
          );
        }

        navigate("/student-dashboard");
        return;
      }

      if (role === "teacher") {
        const approvedSnap = await getDoc(doc(db, "teachers", uid));
        const pendingSnap = await getDoc(doc(db, "pendingTeachers", uid));

        if (approvedSnap.exists()) {
          navigate("/teacher-dashboard");
          return;
        }

        if (pendingSnap.exists()) {
          alert("Your teacher account is still pending approval.");
          navigate("/");
          return;
        }

        await setDoc(doc(db, "pendingTeachers", uid), {
          uid,
          email: loggedUser.email!,
          name: loggedUser.displayName || name || "",
          role: "teacher",
          subject: selectedSubject || null,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        alert("Your teacher registration is pending approval by the principal.");
        navigate("/");
        return;
      }

      // ---------- Parent Google ----------
      if (role === "parent") {
        const parentSnap = await getDoc(doc(db, "parents", uid));
        if (parentSnap.exists()) {
          navigate("/parent-dashboard");
          return;
        }

        // new parent signup + registration
        await setDoc(doc(db, "parents", uid), {
          uid,
          email: loggedUser.email!,
          name: loggedUser.displayName || name || "",
          role: "parent",
          createdAt: new Date().toISOString(),
        });

        const regRef = doc(collection(db, "registrations"));
        await setDoc(regRef, {
          parentId: uid,
          purpose: "fees",
          status: "payment_pending",
          paymentReceived: false,
          createdAt: new Date().toISOString(),
        });

        await setDoc(
          doc(db, "parents", uid),
          { registrationId: regRef.id },
          { merge: true }
        );

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
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Student Login Fields */}
            {role === "student" && !isSignup && (
              <>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">-- Select Grade --</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Student Name</Label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {students.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Non-student Email */}
            {role !== "student" && (
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

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

            {/* Teacher Signup Fields */}
            {isSignup && role === "teacher" && (
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
                <FcGoogle className="w-5 h-5" />
                Google
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
