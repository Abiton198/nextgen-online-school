import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebaseConfig"; // adjust path if needed
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "parent" | "principal" | null>(null);
  const [teacherAction, setTeacherAction] = useState<"none" | "apply" | "signin">("none");

  const navigate = useNavigate();

  // 🔑 Email/password login
  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      if (role === "teacher") {
        const teacherRef = doc(db, "teachers", user.uid);
        const snap = await getDoc(teacherRef);
        if (!snap.exists()) {
          // first login: redirect to application
          await setDoc(teacherRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_review",
          });
          navigate("/teacher-application");
        } else {
          navigate("/teacher-dashboard");
        }
      } else if (role === "parent") {
        const parentRef = doc(db, "parents", user.uid);
        const snap = await getDoc(parentRef);
        if (!snap.exists()) {
          await setDoc(parentRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_registration",
          });
          navigate("/register"); // start child registration
        } else {
          navigate("/parent-dashboard");
        }
      } else if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "principal") {
        navigate("/principal-dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // 🔑 Google login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (role === "teacher") {
        const teacherRef = doc(db, "teachers", user.uid);
        const snap = await getDoc(teacherRef);
        if (!snap.exists()) {
          await setDoc(teacherRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_review",
          });
          navigate("/teacher-application");
        } else {
          navigate("/teacher-dashboard");
        }
      } else if (role === "parent") {
        const parentRef = doc(db, "parents", user.uid);
        const snap = await getDoc(parentRef);
        if (!snap.exists()) {
          await setDoc(parentRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_registration",
          });
          navigate("/register");
        } else {
          navigate("/parent-dashboard");
        }
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded bg-white shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      {/* Role selection */}
      <div className="mb-4 space-x-2">
        {["student", "teacher", "parent", "principal"].map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r as any);
              setTeacherAction("none");
            }}
            className={`px-3 py-1 rounded ${
              role === r ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Special case for Teacher */}
      {role === "teacher" && teacherAction === "none" && (
        <div className="mb-4 border p-3 rounded bg-gray-50">
          <p className="mb-2 font-medium">Are you a new teacher or returning?</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/teacher-application")}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
            >
              📝 Apply
            </button>
            <button
              onClick={() => setTeacherAction("signin")}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded"
            >
              🔑 Sign in
            </button>
          </div>
        </div>
      )}

      {/* Login form (for parent + student + principal + teacher sign-in) */}
      {(role && (role !== "teacher" || teacherAction === "signin")) && (
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
