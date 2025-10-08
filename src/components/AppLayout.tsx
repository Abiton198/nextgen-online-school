"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginForm from "./auth/LoginForm";
import ParentDashboard from "./dashboards/parent/ParentDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import PrincipalDashboard from "./dashboards/PrincipalDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

// ✅ Logos
import logo from "../img/logo.png";       // NextGen Logo
import dbeLogo from "../img/dbe.png";     // DBE Logo
import ZoomableImage from "@/lib/ZoomableImage";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ⏳ Loading Screen
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

  // 🚪 Home / Landing Page
  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url(https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616805155_a5c804bd.webp)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/60 to-indigo-900/60"></div>

        {/* 🔥 Top Logos Bar */}
        <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-20">
        
        {/* zoomable image */}
          <ZoomableImage 
            src={logo} 
            alt="NextGen Logo" 
            className="h-14 w-auto drop-shadow-lg" 
          />
        
          <img src={dbeLogo} alt="DBE Logo" className="h-14 w-auto drop-shadow-lg" />
        </div>

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

          {/* ✨ Login Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLoginModal(true)}
            className="bg-white text-blue-700 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-yellow-300 transition-all flex items-center gap-2"
          >
            <img src={logo} alt="NextGen Logo" className="w-8 h-8" />
            Access Portal
          </motion.button>

          {/* Info Footer */}
          <div className="mt-8 max-w-md">
            <p className="text-sm md:text-base text-blue-100 drop-shadow-sm">
              Convenient, connected, and career-focused — an integrated online
              school experience built for modern learning and future pathways.
            </p>
            <a
              href="/about"
              className="mt-3 inline-block text-sm font-medium text-yellow-300 hover:text-yellow-400 transition"
            >
              Learn more about our school →
            </a>
          </div>
        </div>

        {/* 🪟 Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-[95%] max-w-md relative text-gray-800"
              >
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>

                <h2 className="text-2xl font-semibold text-center mb-4 text-blue-700">
                  Login to Continue
                </h2>

                <LoginForm />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 🧭 Logged-in Dashboards (Role-based)
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

// 🧱 App Layout Wrapper
const AppLayout: React.FC = () => {
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

  return (
    <AuthProvider>
      <div className="font-sans antialiased min-h-screen flex flex-col">
        <AppContent />

        {/* Footer */}
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500 relative">
          <button
            onClick={() => setShowAdminPrompt(true)}
            className="hover:text-blue-600"
          >
            © {new Date().getFullYear()} NextGen Independent Online High School
          </button>
        </footer>

        {/* 🔐 Admin Access Confirmation */}
        <AnimatePresence>
          {showAdminPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-lg shadow-xl p-6 w-80 text-center"
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Admin Access Only
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                  This area is restricted to administrators. Continue?
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthProvider>
  );
};

export default AppLayout;
