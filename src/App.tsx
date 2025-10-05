"use client";

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"; // ✅ import

// Auth Pages
import LoginForm from "@/components/auth/LoginForm";
import AdminLoginForm from "@/components/auth/AdminLoginForm";
import SuspendedScreen from "@/components/auth/SuspendedScreen";
import TeacherApplicationForm from "@/components/auth/TeacherApplicationForm";
import ParentRegistration from "@/components/auth/ParentRegistration";

// Dashboards
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import ParentDashboard from "@/components/dashboards/parent/ParentDashboard";
import PrincipalDashboard from "@/components/dashboards/PrincipalDashboard";

// Parent Sections
import PaymentsSection from "@/components/dashboards/parent/sections/PaymentSection";
import StatusSection from "@/components/dashboards/parent/sections/StatusSection";

// Public Pages
import AboutUs from "@/components/AboutUs";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/AppLayout"; // ✅ Landing/Home page

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Toast notifications */}
          <Toaster />
          <Sonner />

          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* 🌍 Default Home/Landing Page */}
                <Route path="/" element={<AppLayout />} />

                {/* ℹ️ Public Pages */}
                <Route path="/about" element={<AboutUs />} />

                {/* 👨‍👩‍👧 Parent Registration and Info */}
                <Route path="/register" element={<ParentRegistration />} />
                <Route path="/payments" element={<PaymentsSection />} />
                <Route path="/status" element={<StatusSection />} />

                {/* 🔐 Authentication Pages */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/admin-login" element={<AdminLoginForm />} />
                <Route path="/suspended" element={<SuspendedScreen />} />
                <Route path="/teacher-application" element={<TeacherApplicationForm />} />

                {/* 🧭 Dashboards (protected by role) */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/principal-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["principal"]}>
                      <PrincipalDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 🚫 Fallback for invalid URLs */}
                <Route path="*" element={<NotFound />} />

                {/* ✅ Optional: If user visits /home, redirect to main landing */}
                <Route path="/home" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
