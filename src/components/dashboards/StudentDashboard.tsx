import React from 'react';
import { useAuth } from '../auth/AuthProvider';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Mock student data - in real app would come from Firestore
  const studentData = {
    currentClasses: [
      { subject: 'Mathematics', time: '09:00 AM', meetLink: '#', teacher: 'Mr. Smith' },
      { subject: 'Physics', time: '11:00 AM', meetLink: '#', teacher: 'Dr. Johnson' },
      { subject: 'Chemistry', time: '02:00 PM', meetLink: '#', teacher: 'Ms. Davis' }
    ],
    assignments: [
      { subject: 'Math', title: 'Algebra Problems', due: '2024-01-20', status: 'pending' },
      { subject: 'Physics', title: 'Lab Report', due: '2024-01-22', status: 'submitted' },
      { subject: 'English', title: 'Essay Writing', due: '2024-01-25', status: 'pending' }
    ],
    points: 850,
    attendance: 95,
    upcomingExams: [
      { subject: 'Mathematics', date: '2024-01-30', type: 'Term Test' },
      { subject: 'Physics', date: '2024-02-05', type: 'Practical Exam' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Points</h3>
            <p className="text-3xl font-bold">{studentData.points}</p>
          </div>
          <div className="bg-green-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Attendance</h3>
            <p className="text-3xl font-bold">{studentData.attendance}%</p>
          </div>
          <div className="bg-orange-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Assignments</h3>
            <p className="text-3xl font-bold">{studentData.assignments.length}</p>
          </div>
          <div className="bg-purple-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Grade</h3>
            <p className="text-3xl font-bold">{user?.grade?.replace('Grade ', '')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Classes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Today's Classes</h2>
            <div className="space-y-4">
              {studentData.currentClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                    <p className="text-sm text-gray-600">{cls.time} - {cls.teacher}</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Join Class
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Assignments</h2>
            <div className="space-y-4">
              {studentData.assignments.map((assignment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600">{assignment.subject} - Due: {assignment.due}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'submitted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;