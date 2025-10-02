import React, { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginForm from "./auth/LoginForm";
import ParentDashboard from "./dashboards/parent/ParentDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import PrincipalDashboard from "./dashboards/PrincipalDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import logo from "../img/logo.png";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading NextGen School Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url(https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616805155_a5c804bd.webp)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/60 to-indigo-900/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">
            NextGen Independent Online{" "}
            <span className="block text-yellow-300">School Portal</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-10 text-blue-100 drop-shadow-md">
            “A New Age STEM High School — CAPS-Aligned, Future-Ready, and
            inspiring the next generation in Mathematics, Medicine, Technology,
            and Innovation.”
          </p>

          {/* Collapsible login box */}
          <div
            className="bg-white rounded-lg shadow-2xl text-gray-800 cursor-pointer transition-all duration-300 overflow-hidden"
            style={{
              width: expanded ? "320px" : "120px",
              height: expanded ? "auto" : "120px",
            }}
            onClick={() => !expanded && setExpanded(true)}
          >
            {!expanded ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <img src={logo} alt="NextGen Logo" className="w-18 h-18 mb-2" />
                <p className="text-sm font-medium text-blue-700 underline">
                  Access here!
                </p>
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-center mb-4">
                  Login to Continue
                </h2>
                <LoginForm />
                <p
                  className="text-center text-xs mt-4 text-blue-600 underline cursor-pointer"
                  onClick={() => setExpanded(false)}
                >
                  Close
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 max-w-md">
            <p className="text-sm md:text-base text-blue-100 drop-shadow-sm">
              Convenient, connected, and career-focused — an integrated online
              school experience built for modern learning and future pathways.
            </p>
            <a
              href="/about"
              className="mt-2 inline-block text-sm font-medium text-yellow-300 hover:text-yellow-400 transition"
            >
              Learn more about our school →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in dashboards
  switch (user.role) {
    case "parent":
      return <ParentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "principal":
      return <PrincipalDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <LoginForm />;
  }
};

const AppLayout: React.FC = () => {
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

  return (
    <AuthProvider>
      <div className="font-sans antialiased min-h-screen flex flex-col">
        <AppContent />

        {/* Footer with protected Admin Login */}
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500 relative">
          <button
            onClick={() => setShowAdminPrompt(true)}
            className="hover:text-blue-600"
          >
            © 2025 NextGen Independent Online High School
          </button>
        </footer>

        {/* Confirmation modal */}
        {showAdminPrompt && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
              <h3 className="text-lg font-semibold mb-3">
                Admin Access Only
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                This area is for administrators. Do you want to continue?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowAdminPrompt(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (window.location.href = "/admin-login")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthProvider>
  );
};

export default AppLayout;
