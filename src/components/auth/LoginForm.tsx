"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "parent" | "principal" | null>(null);
  const [teacherAction, setTeacherAction] = useState<"none" | "apply" | "signin">("none");
  const [isParentSignup, setIsParentSignup] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ?unauthorized=true redirect banner
  const unauthorized = new URLSearchParams(location.search).get("unauthorized") === "true";

  /* -------------------- Login or Signup -------------------- */
  const handleLoginOrSignup = async () => {
    if (!role) {
      alert("Please select your role first.");
      return;
    }

    try {
      let userCred;

      // 🟢 Parent signup flow
      if (role === "parent" && isParentSignup) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        await setDoc(
          doc(db, "parents", user.uid),
          {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email,
            role: "parent",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        alert("Signup successful! Redirecting to parent dashboard...");
        navigate("/parent-dashboard");
        return;
      }

      // 🟢 Normal login flow
      userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const userRef = doc(db, "users", user.uid);

      /* ---------- Principal ---------- */
      if (role === "principal") {
        const ref = doc(db, "principals", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert("Access denied. You are not authorized as a principal.");
          return;
        }

        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "principal", createdAt: serverTimestamp() },
          { merge: true }
        );
        navigate("/principal-dashboard");
        return;
      }

      /* ---------- Teacher ---------- */
      if (role === "teacher") {
        const ref = doc(db, "teachers", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("No teacher profile found. Please apply first.");
          navigate("/teacher-application");
          return;
        }

        const data = snap.data();
        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "teacher", createdAt: serverTimestamp() },
          { merge: true }
        );

        if (data?.status === "approved" && data?.classActivated) {
          navigate("/teacher-dashboard");
        } else {
          alert("Your teacher account is not yet fully active.");
          navigate("/teacher-application");
        }
        return;
      }

      /* ---------- Student ---------- */
      if (role === "student") {
        // Try finding by UID first
        let q = query(collection(db, "students"), where("uid", "==", user.uid));
        let querySnap = await getDocs(q);

        // If not found, fallback to email
        if (querySnap.empty) {
          q = query(collection(db, "students"), where("email", "==", user.email));
          querySnap = await getDocs(q);
        }

        if (querySnap.empty) {
          alert("No student record found. Please contact your school.");
          await auth.signOut();
          return;
        }

        const studentDoc = querySnap.docs[0];
        const data = studentDoc.data();

        if (!data.approvedByPrincipal && data.status !== "enrolled") {
          alert("Your account is not yet approved by the principal.");
          await auth.signOut();
          return;
        }

        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            role: "student",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        navigate("/student-dashboard");
        return;
      }

      /* ---------- Parent ---------- */
      if (role === "parent") {
        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "parent", createdAt: serverTimestamp() },
          { merge: true }
        );
        navigate("/parent-dashboard");
        return;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      alert(isParentSignup ? "Signup failed. Try again." : "Login failed. Check your credentials.");
    }
  };

  /* -------------------- Google Login -------------------- */
  const handleGoogleLogin = async () => {
    if (!role) {
      alert("Please select your role before using Google login.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);

      /* ---------- Teacher ---------- */
      if (role === "teacher") {
        const ref = doc(db, "teachers", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_review",
            classActivated: false,
          });

          await setDoc(
            userRef,
            { uid: user.uid, email: user.email, role: "teacher", createdAt: serverTimestamp() },
            { merge: true }
          );

          alert("Application submitted. Await principal approval.");
          navigate("/teacher-application");
          return;
        }

        const data = snap.data();
        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "teacher", createdAt: serverTimestamp() },
          { merge: true }
        );

        if (data?.status === "approved" && data?.classActivated) {
          navigate("/teacher-dashboard");
        } else {
          alert("Your teacher account is not yet active.");
          navigate("/teacher-application");
        }
        return;
      }

      /* ---------- Parent ---------- */
      if (role === "parent") {
        const ref = doc(db, "parents", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
            status: "pending_registration",
          });
        }

        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "parent", createdAt: serverTimestamp() },
          { merge: true }
        );

        navigate("/parent-dashboard");
        return;
      }

      /* ---------- Student ---------- */
      if (role === "student") {
        let q = query(collection(db, "students"), where("uid", "==", user.uid));
        let querySnap = await getDocs(q);

        if (querySnap.empty) {
          q = query(collection(db, "students"), where("email", "==", user.email));
          querySnap = await getDocs(q);
        }

        if (querySnap.empty) {
          alert("No student record found. Please contact your school.");
          await auth.signOut();
          return;
        }

        const studentDoc = querySnap.docs[0];
        const data = studentDoc.data();

        if (!data.approvedByPrincipal && data.status !== "enrolled") {
          alert("Your account is not yet approved by the principal.");
          await auth.signOut();
          return;
        }

        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "student", createdAt: serverTimestamp() },
          { merge: true }
        );

        navigate("/student-dashboard");
        return;
      }

      /* ---------- Principal ---------- */
      if (role === "principal") {
        const ref = doc(db, "principals", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert("Access denied. You are not authorized as a principal.");
          return;
        }

        await setDoc(
          userRef,
          { uid: user.uid, email: user.email, role: "principal", createdAt: serverTimestamp() },
          { merge: true }
        );

        navigate("/principal-dashboard");
        return;
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed. Please try again.");
    }
  };

  const handleClose = () => navigate("/");

  /* -------------------- UI -------------------- */
  return (
    <div className="max-w-md mx-auto p-6 border rounded bg-white shadow relative">
      {/* 🔴 Close */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-xl font-bold"
        title="Close login"
      >
        ✕
      </button>

      {/* 🚨 Unauthorized banner */}
      {unauthorized && (
        <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700 text-center">
          You are not authorized to access that page. Please log in with the correct role.
        </div>
      )}

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
              {role === "parent" && isParentSignup ? "Parent Signup" : "Sign in to Your Account"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleLoginOrSignup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {role === "parent" && isParentSignup ? "Signup" : "Login"}
            </button>

            {/* 👨‍👩‍👧 Parent toggle */}
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
