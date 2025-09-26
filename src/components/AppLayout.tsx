// src/AppLayout.tsx
import React from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginForm from "./auth/LoginForm";
import ParentDashboard from "./dashboards/parent/ParentDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import PrincipalDashboard from "./dashboards/PrincipalDashboard";
import AdminDashboard from "./dashboards/AdminDashboard"; // secret login

// ------------------- Main AppContent -------------------
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NextGen School Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  switch (user.role) {
    case "parent":
      return <ParentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "principal":
      return <PrincipalDashboard />;
    case "admin":
      return <AdminDashboard />; // secret route
    default:
      return <LoginForm />;
  }
};

// ------------------- App Layout -------------------
const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <div className="font-sans antialiased flex flex-col min-h-screen">
        {/* Hero Section */}
        <div id="hero-section" className="flex-1">
          <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage:
                  "url(https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616805155_a5c804bd.webp)",
              }}
            ></div>

            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
              <div className="text-center text-white max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  NextGen Independent Online
                  <span className="block text-yellow-300">School Portal</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
                  Transforming education through innovative technology.
                  Connecting students, parents, teachers, and principals in one
                  seamless platform.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616806119_aaaa43c4.webp"
                      alt="Parent Dashboard"
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">
                      Parent Dashboard
                    </h3>
                    <p className="text-sm text-blue-100">
                      Monitor your child's progress and manage school
                      engagement.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616807613_5ea69d49.webp"
                      alt="Teacher Tools"
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
                    <p className="text-sm text-blue-100">
                      Manage classes, grade assignments, and communicate with
                      parents.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616806868_c4dbdfd5.webp"
                      alt="Principal Dashboard"
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">
                      Principal Dashboard
                    </h3>
                    <p className="text-sm text-blue-100">
                      Approve teachers, oversee students, and ensure smooth
                      school operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main App */}
        <AppContent />

        {/* Hidden Footer with Admin Login */}
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
          <button
            onClick={() => (window.location.href = "/admin-login")}
            className="hover:text-blue-600"
          >
            © 2025 NextGen Independent Online School
          </button>
        </footer>
      </div>
    </AuthProvider>
  );
};

export default AppLayout;
