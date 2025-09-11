import React from 'react';
import { useAuth } from '../auth/AuthProvider';

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Mock parent data - in real app would come from Firestore
  const parentData = {
    children: [
      {
        id: '1',
        name: 'Alex Johnson',
        grade: 'Grade 10',
        attendance: 95,
        averageGrade: 'A',
        points: 850,
        recentGrades: [
          { subject: 'Mathematics', grade: 'A+', date: '2024-01-15' },
          { subject: 'Physics', grade: 'A', date: '2024-01-12' },
          { subject: 'Chemistry', grade: 'B+', date: '2024-01-10' }
        ]
      }
    ],
    financials: {
      balance: -2500,
      lastPayment: '2024-01-01',
      nextDue: '2024-02-01',
      invoices: [
        { id: 'INV001', amount: 2500, status: 'overdue', date: '2024-01-01' },
        { id: 'INV002', amount: 2500, status: 'upcoming', date: '2024-02-01' }
      ]
    },
    messages: [
      { from: 'Mr. Smith', subject: 'Math Progress Update', date: '2024-01-18', unread: true },
      { from: 'Principal Davis', subject: 'Parent-Teacher Meeting', date: '2024-01-17', unread: false }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
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
        {/* Child Overview Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Children Overview</h2>
          {parentData.children.map((child) => (
            <div key={child.id} className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
                  <p className="text-gray-600">{child.grade}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{child.averageGrade}</p>
                  <p className="text-sm text-gray-600">Overall Grade</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{child.attendance}%</p>
                  <p className="text-sm text-gray-600">Attendance</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{child.points}</p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{child.recentGrades.length}</p>
                  <p className="text-sm text-gray-600">Recent Grades</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recent Grades</h4>
                <div className="space-y-2">
                  {child.recentGrades.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{grade.subject}</span>
                      <div className="text-right">
                        <span className="font-bold text-green-600">{grade.grade}</span>
                        <span className="text-sm text-gray-500 ml-2">{grade.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Current Balance:</span>
                <span className={`font-bold text-lg ${
                  parentData.financials.balance < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  R{Math.abs(parentData.financials.balance)}
                  {parentData.financials.balance < 0 && ' (Outstanding)'}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Next Payment Due:</span>
                <span className="font-medium">{parentData.financials.nextDue}</span>
              </div>
            </div>

            <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors mb-4">
              Make Payment
            </button>

            <div>
              <h4 className="font-semibold mb-2">Recent Invoices</h4>
              <div className="space-y-2">
                {parentData.financials.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{invoice.id}</span>
                      <p className="text-sm text-gray-600">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">R{invoice.amount}</span>
                      <span className={`block text-xs ${
                        invoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="space-y-4">
              {parentData.messages.map((message, index) => (
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

export default ParentDashboard;