import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Wait for Firebase to finish checking the session
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role || "")) {
    // Logged in, but wrong role
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
