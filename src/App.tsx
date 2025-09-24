import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import ParentDashboard from "./components/dashboards/ParentDashboard";
import { Footer } from "./components/Footer";
import { AdminLoginForm } from "./components/auth/AdminLoginForm";
import PendingApprovalScreen from "./components/auth/PendingApprovalScreen";
import SuspendedScreen from "./components/auth/SuspendedScreen"; // ✅ NEW

const queryClient = new QueryClient();

// Wrapper that decides between pending, suspended, or dashboard
const RoleBasedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  // 🚦 If user is pending → show pending screen
  if (user.status === "pending") {
    return <PendingApprovalScreen />;
  }

  // 🚦 If user is suspended → show suspended screen
  if (user.status === "suspended") {
    return <SuspendedScreen />;
  }

  // 🚦 Otherwise → check role normally
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <div>Access denied</div>;
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />

                {/* ✅ Admin is special → only ProtectedRoute */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ✅ Teacher dashboard */}
                <Route
                  path="/teacher-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["teacher"]}>
                      <TeacherDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* ✅ Student dashboard */}
                <Route
                  path="/student-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* ✅ Parent dashboard */}
                <Route
                  path="/parent-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["parent"]}>
                      <ParentDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Other routes */}
                <Route path="/admin-login" element={<AdminLoginForm />} />
                <Route path="/footer" element={<Footer />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
