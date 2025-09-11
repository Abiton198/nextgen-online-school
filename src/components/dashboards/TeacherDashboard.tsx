import React from 'react';
import { useAuth } from '../auth/AuthProvider';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Mock teacher data - in real app would come from Firestore
  const teacherData = {
    classes: [
      { 
        id: '1', 
        subject: 'Mathematics', 
        grade: 'Grade 10A', 
        students: 28, 
        nextClass: '09:00 AM',
        attendance: 92
      },
      { 
        id: '2', 
        subject: 'Physics', 
        grade: 'Grade 11B', 
        students: 25, 
        nextClass: '11:00 AM',
        attendance: 88
      }
    ],
    pendingAssignments: [
      { student: 'Alex Johnson', assignment: 'Algebra Test', subject: 'Math', dueDate: '2024-01-20' },
      { student: 'Sarah Smith', assignment: 'Lab Report', subject: 'Physics', dueDate: '2024-01-22' },
      { student: 'Mike Davis', assignment: 'Problem Set 5', subject: 'Math', dueDate: '2024-01-25' }
    ],
    recentMessages: [
      { from: 'Parent - Johnson', subject: 'Alex\'s Progress', date: '2024-01-18', unread: true },
      { from: 'Principal Davis', subject: 'Staff Meeting', date: '2024-01-17', unread: false }
    ],
    todaySchedule: [
      { time: '09:00', class: 'Math - Grade 10A', room: 'Room 101' },
      { time: '11:00', class: 'Physics - Grade 11B', room: 'Lab 201' },
      { time: '14:00', class: 'Math - Grade 10B', room: 'Room 101' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
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
          <div className="bg-orange-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Total Classes</h3>
            <p className="text-3xl font-bold">{teacherData.classes.length}</p>
          </div>
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold">
              {teacherData.classes.reduce((sum, cls) => sum + cls.students, 0)}
            </p>
          </div>
          <div className="bg-yellow-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Grades</h3>
            <p className="text-3xl font-bold">{teacherData.pendingAssignments.length}</p>
          </div>
          <div className="bg-green-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Avg Attendance</h3>
            <p className="text-3xl font-bold">
              {Math.round(teacherData.classes.reduce((sum, cls) => sum + cls.attendance, 0) / teacherData.classes.length)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
            <div className="space-y-4">
              {teacherData.todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.class}</h3>
                    <p className="text-sm text-gray-600">{item.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{item.time}</p>
                    <button className="text-sm bg-orange-600 text-white px-3 py-1 rounded mt-1 hover:bg-orange-700 transition-colors">
                      Start Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Classes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">My Classes</h2>
            <div className="space-y-4">
              {teacherData.classes.map((cls) => (
                <div key={cls.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                      <p className="text-sm text-gray-600">{cls.grade}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {cls.students} students
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Next: {cls.nextClass}</p>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                        Attendance
                      </button>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                        Gradebook
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Assignments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Pending Grading</h2>
            <div className="space-y-4">
              {teacherData.pendingAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{assignment.assignment}</h3>
                    <p className="text-sm text-gray-600">{assignment.student} - {assignment.subject}</p>
                    <p className="text-xs text-gray-500">Due: {assignment.dueDate}</p>
                  </div>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                    Grade
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Messages</h2>
            <div className="space-y-4">
              {teacherData.recentMessages.map((message, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  message.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                    {message.unread && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">From: {message.from}</p>
                  <p className="text-xs text-gray-500 mt-1">{message.date}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              View All Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;