import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Teacher application
import TeacherApplicationForm from "@/components/auth/TeacherApplicationForm";
import TeacherDocumentUpload from "./components/auth/TeacherDocumentUpload";
import TeacherApprovalStatus from "./components/auth/TeacherApprovalStatus";
import TeacherCongratsOrReject from "./components/auth/TeacherCongratsOrReject";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import ParentDashboard from "./components/dashboards/parent/ParentDashboard";
import { Footer } from "./components/Footer";
import { AdminLoginForm } from "./components/auth/AdminLoginForm";
import PendingApprovalScreen from "./components/auth/PendingApprovalScreen";
import SuspendedScreen from "./components/auth/SuspendedScreen";

// ✅ Payments
import PaymentSuccess from "./components/payments/PaymentSuccess";
import PaymentDetails from "./components/payments/PaymentDetails";
import PaymentCancel from "./components/payments/PaymentCancel";
import ParentRegistration from "./components/dashboards/parent/ParentRegistration";
import PaymentPage from "./components/payments/PaymentPage";
import PaymentsSection from "./components/dashboards/parent/sections/PaymentSection"
import StatusSection from "./components/dashboards/parent/sections/StatusSection";


const queryClient = new QueryClient();

// Wrapper for role-based routing
const RoleBasedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user) return <Navigate to="/admin-login" replace />;

  if (user.status === "pending") return <PendingApprovalScreen />;
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
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />

                {/* Admin */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
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

                {/* Payments */}
                <Route path="/register" element={<ParentRegistration />} />
                <Route path="/payments/:regId" element={<PaymentPage />} />
                <Route path="/payment-details/:regId" element={<PaymentDetails />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                 <Route path="/status" element={<StatusSection />} /> 
                 <Route path="/payments" element={<PaymentsSection />} /> 

                {/* Other */}
                <Route path="/admin-login" element={<AdminLoginForm />} />
                <Route path="/footer" element={<Footer />} />

                {/* Teacher Application */}
                <Route path="/apply-teacher" element={<TeacherApplicationForm />} />
                <Route path="/upload-teacher-docs" element={<TeacherDocumentUpload />} />
                <Route path="/teacher-status" element={<TeacherApprovalStatus />} />
                <Route path="/teacher-result" element={<TeacherCongratsOrReject />} />


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
