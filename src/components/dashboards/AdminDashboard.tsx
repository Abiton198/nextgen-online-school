import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText,
  UserCheck,
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import { RegistrationApproval } from '@/components/admin/RegistrationApproval';
interface AdminDashboardProps {
  user: any;
  logout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, logout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get registration requests count for badge
  const registrationRequests = JSON.parse(localStorage.getItem('registrationRequests') || '[]');
  const pendingCount = registrationRequests.filter((r: any) => r.status === 'pending').length;

  // Sample admin data - in real app this would come from Firebase/API
  const adminData = {
    stats: {
      totalStudents: 450,
      totalTeachers: 25,
      totalParents: 380,
      revenue: 1250000,
      attendance: 94,
      pendingApplications: pendingCount
    },
    recentActivities: [
      { action: 'New student enrolled', user: 'John Smith', time: '2 hours ago' },
      { action: 'Payment received', user: 'Parent - Davis', time: '4 hours ago' },
      { action: 'Teacher added', user: 'Dr. Wilson', time: '1 day ago' },
      { action: 'Grade report generated', user: 'System', time: '2 days ago' }
    ],
    financialSummary: {
      monthlyRevenue: 125000,
      outstandingFees: 45000,
      paidFees: 105000,
      expenses: 85000
    },
    systemAlerts: [
      { type: 'warning', message: 'Server maintenance scheduled for tonight', priority: 'high' },
      { type: 'info', message: `${pendingCount} new applications pending approval`, priority: 'medium' },
      { type: 'success', message: 'Backup completed successfully', priority: 'low' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System Administration & Management</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Registrations
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Students</p>
                      <p className="text-2xl font-bold">{adminData.stats.totalStudents}</p>
                    </div>
                    <GraduationCap className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Teachers</p>
                      <p className="text-2xl font-bold">{adminData.stats.totalTeachers}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Parents</p>
                      <p className="text-2xl font-bold">{adminData.stats.totalParents}</p>
                    </div>
                    <Users className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Revenue</p>
                      <p className="text-2xl font-bold">R{(adminData.stats.revenue / 1000)}k</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100">Attendance</p>
                      <p className="text-2xl font-bold">{adminData.stats.attendance}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-indigo-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">Pending</p>
                      <p className="text-2xl font-bold">{adminData.stats.pendingApplications}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminData.systemAlerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                    'bg-green-50 border-green-400'
                  }`}>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-800">{alert.message}</p>
                      <Badge variant={
                        alert.priority === 'high' ? 'destructive' :
                        alert.priority === 'medium' ? 'secondary' : 'default'
                      }>
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-medium">Monthly Revenue</span>
                    <span className="text-xl font-bold text-green-600">
                      R{adminData.financialSummary.monthlyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium">Fees Collected</span>
                    <span className="text-xl font-bold text-blue-600">
                      R{adminData.financialSummary.paidFees.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="font-medium">Outstanding Fees</span>
                    <span className="text-xl font-bold text-red-600">
                      R{adminData.financialSummary.outstandingFees.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <RegistrationApproval />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage students, teachers, and parent accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure school settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;