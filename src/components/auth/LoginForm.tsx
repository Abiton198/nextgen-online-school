import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<
    "student" | "teacher" | "parent" | "principal" | null
  >(null);
  const [teacherAction, setTeacherAction] = useState<"none" | "apply" | "signin">(
    "none"
  );

  const navigate = useNavigate();

  // 🔑 Email/password login
  const handleLogin = async () => {
    if (!role) {
      alert("Please select your role first.");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // ✅ Only navigate after confirmed role
      switch (role) {
        case "teacher":
          navigate("/teacher-dashboard");
          break;
        case "parent":
          navigate("/parent-dashboard");
          break;
        case "student":
          navigate("/student-dashboard");
          break;
        case "principal":
          navigate("/principal-dashboard");
          break;
      }
    } catch (err) {
      console.error(err);
      alert("Login failed. Check your credentials.");
    }
  };

  // 🔑 Google login
  const handleGoogleLogin = async () => {
    if (!role) {
      alert("Please select your role before using Google login.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ Create doc only when first-time user applies
      if (role === "teacher") {
        const teacherRef = doc(db, "teachers", user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (!teacherSnap.exists()) {
          await setDoc(teacherRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_review",
          });
        }
        navigate("/teacher-dashboard");
      } else if (role === "parent") {
        const parentRef = doc(db, "parents", user.uid);
        const parentSnap = await getDoc(parentRef);
        if (!parentSnap.exists()) {
          await setDoc(parentRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_registration",
          });
        }
        navigate("/parent-dashboard");
      } else if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "principal") {
        navigate("/principal-dashboard");
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded bg-white shadow">
      <h2 className="text-xl font-bold mb-4">Welcome — Choose Your Role</h2>

      {/* Role Selection */}
      <div className="mb-4 space-x-2 flex flex-wrap gap-2">
        {(["student", "teacher", "parent", "principal"] as const).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setTeacherAction("none");
            }}
            className={`px-3 py-1 rounded ${
              role === r ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Teacher choice */}
      {role === "teacher" && teacherAction === "none" && (
        <div className="mb-4 border p-3 rounded bg-gray-50">
          <p className="mb-2 font-medium">Are you new or returning?</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/teacher-application")}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
            >
              📝 Apply (New)
            </button>
            <button
              onClick={() => setTeacherAction("signin")}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded"
            >
              🔑 Returning
            </button>
          </div>
        </div>
      )}

      {/* Login form */}
      {(role && (role !== "teacher" || teacherAction === "signin")) && (
        <Card className="p-6 shadow-lg border rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-blue-700">
              Sign in to Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Login
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sign in with Google
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
