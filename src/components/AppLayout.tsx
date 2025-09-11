import React from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import LoginForm from './auth/LoginForm';
import StudentDashboard from './dashboards/StudentDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

// Main App Component with Authentication Flow
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
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

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <LoginForm />;
  }
};

// Main AppLayout component with AuthProvider wrapper
const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <div className="font-sans antialiased">
        {/* Hero Section for Unauthenticated Users */}
        <div className="hidden" id="hero-section">
          <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
            {/* Hero Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage: 'url(https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616805155_a5c804bd.webp)'
              }}
            ></div>
            
            {/* Hero Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
              <div className="text-center text-white max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  NextGen
                  <span className="block text-yellow-300">School Portal</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
                  Transforming education through innovative technology. Connect students, parents, teachers, and administrators in one comprehensive platform.
                </p>
                
                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img 
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616806119_aaaa43c4.webp" 
                      alt="Student Portal" 
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">Student Portal</h3>
                    <p className="text-sm text-blue-100">Access classes, assignments, and track your academic progress</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img 
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616806868_c4dbdfd5.webp" 
                      alt="Parent Dashboard" 
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">Parent Dashboard</h3>
                    <p className="text-sm text-blue-100">Monitor your child's progress and manage school payments</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img 
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616807613_5ea69d49.webp" 
                      alt="Teacher Tools" 
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
                    <p className="text-sm text-blue-100">Manage classes, grade assignments, and communicate with parents</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <img 
                      src="https://d64gsuwffb70l.cloudfront.net/68c31a777600b687984e53d0_1757616808445_ccccf647.webp" 
                      alt="Admin Control" 
                      className="w-16 h-16 mx-auto mb-4 rounded-lg"
                    />
                    <h3 className="text-lg font-semibold mb-2">Admin Control</h3>
                    <p className="text-sm text-blue-100">Comprehensive school management and analytics dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Application Content */}
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default AppLayout;
