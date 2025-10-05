import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  const [isParentSignup, setIsParentSignup] = useState(false);

  const navigate = useNavigate();

  // ✅ Handle Login or Signup
  const handleLoginOrSignup = async () => {
    if (!role) {
      alert("Please select your role first.");
      return;
    }

    try {
      let userCred;

      // 🟢 Parent signup
      if (role === "parent" && isParentSignup) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        await setDoc(doc(db, "parents", user.uid), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          createdAt: serverTimestamp(),
          status: "pending_registration",
        });

        alert("Signup successful! Redirecting to dashboard...");
        navigate("/parent-dashboard");
        return;
      }

      // 🟢 Regular login
      userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 🔒 Secure principal check
      if (role === "principal") {
        const principalRef = doc(db, "principals", user.uid);
        const principalSnap = await getDoc(principalRef);

        if (!principalSnap.exists()) {
          alert("Access denied. You are not authorized as a principal.");
          return;
        }

        navigate("/principal-dashboard");
        return;
      }

      // ✅ Normal routing
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
      }
    } catch (err: any) {
      console.error(err);
      alert(
        isParentSignup
          ? "Signup failed. Please check your details and try again."
          : "Login failed. Check your email or password."
      );
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    if (!role) {
      alert("Please select your role before using Google login.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
        // 🔒 Verify principal authorization before allowing access
        const principalRef = doc(db, "principals", user.uid);
        const principalSnap = await getDoc(principalRef);

        if (!principalSnap.exists()) {
          alert("Access denied. You are not authorized as a principal.");
          return;
        }

        navigate("/principal-dashboard");
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed. Please try again.");
    }
  };

  // ✅ Close login modal or page
  const handleClose = () => {
    navigate("/"); // Redirect to your home or landing route
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded bg-white shadow relative">
      {/* 🔴 Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-xl font-bold"
        title="Close login"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4 text-center">Welcome — Choose Your Role</h2>

      {/* 🧩 Role Selection */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(["student", "teacher", "parent", "principal"] as const).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setTeacherAction("none");
              setIsParentSignup(false);
            }}
            className={`px-3 py-1 rounded ${
              role === r ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* 👨‍🏫 Teacher Choice */}
      {role === "teacher" && teacherAction === "none" && (
        <div className="mb-4 border p-3 rounded bg-gray-50">
          <p className="mb-2 font-medium text-center">Are you new or returning?</p>
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

      {/* 🔐 Login / Signup Form */}
      {(role && (role !== "teacher" || teacherAction === "signin")) && (
        <Card className="p-6 shadow-lg border rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-blue-700">
              {role === "parent" && isParentSignup
                ? "Parent Signup"
                : "Sign in to Your Account"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Login / Signup Button */}
            <button
              onClick={handleLoginOrSignup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {role === "parent" && isParentSignup ? "Signup" : "Login"}
            </button>

            {/* 👨‍👩‍👧 Parent Signup / Login Toggle */}
            {role === "parent" && (
              <p className="text-center text-sm text-gray-600">
                {isParentSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setIsParentSignup(false)}
                    >
                      Login here
                    </button>
                  </>
                ) : (
                  <>
                    New parent?{" "}
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setIsParentSignup(true)}
                    >
                      Create account
                    </button>
                  </>
                )}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Google Sign-In */}
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
