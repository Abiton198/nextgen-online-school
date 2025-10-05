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

  // 1️⃣ Still loading Firebase auth → show spinner/loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Checking authentication...
      </div>
    );
  }

  // 2️⃣ Not logged in → force login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Role not allowed → unauthorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4️⃣ Teacher but not approved → force back to application form
  if (user.role === "teacher" && user.status !== "approved") {
    return <Navigate to="/teacher-application" replace />;
  }

  // 5️⃣ Otherwise → allow access
  return <>{children}</>;
};
