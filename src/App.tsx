import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, useAuth } from "./components/auth/AuthProvider";

// Auth
import LoginForm from "./components/auth/LoginForm";
import { AdminLoginForm } from "./components/auth/AdminLoginForm";
import SuspendedScreen from "./components/auth/SuspendedScreen";

// Pages
import NotFound from "./pages/NotFound";
import AboutUs from "./components/AboutUs";

// Dashboards
import AdminDashboard from "./components/dashboards/AdminDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import ParentDashboard from "./components/dashboards/parent/ParentDashboard";
import PrincipalDashboard from "./components/dashboards/PrincipalDashboard";

// Parent sections
import ParentRegistration from "./components/dashboards/parent/ParentRegistration";
import PaymentsSection from "./components/dashboards/parent/sections/PaymentSection";
import StatusSection from "./components/dashboards/parent/sections/StatusSection";

// Landing
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

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
                {/* Landing page with collapsible login */}
                <Route path="/" element={<AppLayout />} />

                {/* Public pages */}
                <Route path="/about" element={<AboutUs />} />
                <Route path="/register" element={<ParentRegistration />} />
                <Route path="/payments" element={<PaymentsSection />} />
                <Route path="/status" element={<StatusSection />} />

                {/* Admin login */}
                <Route path="/admin-login" element={<AdminLoginForm />} />

                {/* Dashboards */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/parent-dashboard" element={<ParentDashboard />} />
                <Route path="/principal-dashboard" element={<PrincipalDashboard />} />

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
