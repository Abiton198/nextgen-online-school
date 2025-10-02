import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./components/auth/AuthProvider";

// Teacher application
import TeacherApplicationForm from "@/components/auth/TeacherApplicationForm";

// Auth
import LoginForm from "./components/auth/LoginForm";   // ✅ add this
import { AdminLoginForm } from "./components/auth/AdminLoginForm";
import SuspendedScreen from "./components/auth/SuspendedScreen";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutUs from "./components/AboutUs";
import { Footer } from "./components/Footer";

// Dashboards
import AdminDashboard from "./components/dashboards/AdminDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import ParentDashboard from "./components/dashboards/parent/ParentDashboard";

// Parent sections
import ParentRegistration from "./components/dashboards/parent/ParentRegistration";
import PaymentsSection from "./components/dashboards/parent/sections/PaymentSection";
import StatusSection from "./components/dashboards/parent/sections/StatusSection";

const queryClient = new QueryClient();

// ✅ Single unified guard
const RoleBasedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;   // ⬅️ now points to LoginForm

  if (!user.role || !user.status) {
    return <div className="p-6 text-center">Fetching your profile...</div>;
  }

  // 🔹 Redirect pending/suspended separately
  if (user.status === "pending") return <Navigate to="/status" replace />;
  if (user.status === "suspended") return <SuspendedScreen />;

  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <div className="p-6 text-red-600 text-center">Access denied</div>;
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* ✅ LoginForm becomes root route */}
                <Route path="/" element={<LoginForm />} />

                {/* Public pages */}
                <Route path="/about" element={<AboutUs />} />

                {/* Admin */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Teacher */}
                <Route
                  path="/teacher-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["teacher"]}>
                      <TeacherDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Student */}
                <Route
                  path="/student-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Parent */}
                <Route
                  path="/parent-dashboard"
                  element={
                    <RoleBasedRoute allowedRoles={["parent"]}>
                      <ParentDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Registration + Payments */}
                <Route path="/register" element={<ParentRegistration />} />
                <Route path="/payments" element={<PaymentsSection />} />
                <Route path="/status" element={<StatusSection />} />

                {/* Other */}
                <Route path="/admin-login" element={<AdminLoginForm />} />
                <Route path="/footer" element={<Footer />} />

                {/* Teacher Application */}
                <Route path="/apply-teacher" element={<TeacherApplicationForm />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
