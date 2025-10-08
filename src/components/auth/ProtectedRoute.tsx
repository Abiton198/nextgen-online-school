"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // 1️⃣ Still loading Firebase auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Checking authentication...
      </div>
    );
  }

  // 2️⃣ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Teacher but not approved yet
  if (user.role === "teacher" && user.status !== "approved") {
    return <Navigate to="/teacher-application" replace />;
  }

  // 4️⃣ Parent but not finished registration
if (user.role === "parent" && user.status === "pending_registration") {
  // ✅ allow /register
  if (window.location.pathname !== "/register") {
    return <Navigate to="/register" replace />;
  }
}


  // 5️⃣ Role mismatch
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 6️⃣ Access granted
  return <>{children}</>;
};
