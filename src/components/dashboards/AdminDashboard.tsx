// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  BarChart3,
  Settings,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { RegistrationApproval } from '@/components/admin/RegistrationApproval';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, onSnapshot, collection, addDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth(); // ✅ no props, straight from AuthProvider
  const [activeTab, setActiveTab] = useState('overview');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const adminDocRef = doc(db, 'admins', user.uid);

    const fetchData = async () => {
      try {
        const docSnap = await getDoc(adminDocRef);

        // ✅ Auto-create admin record if missing
        if (!docSnap.exists()) {
          await setDoc(adminDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "Admin",
            role: "admin",
            createdAt: new Date().toISOString(),
          });
        }

        const refreshedSnap = await getDoc(adminDocRef);
        setAdminData(refreshedSnap.exists() ? refreshedSnap.data() : null);
      } catch (err) {
        console.error("Error fetching admin doc:", err);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(
      adminDocRef,
      (docSnap) => setAdminData(docSnap.exists() ? docSnap.data() : null),
      (err) => console.error("Snapshot error:", err)
    );

    return () => unsubscribe();
  }, [user]);

  // ✅ Helper function: allow admin to create new profiles
  const createUserProfile = async (role: 'student' | 'teacher' | 'parent', name: string, password: string) => {
    try {
      await addDoc(collection(db, `${role}s`), {
        name,
        password, // ⚠️ plain text, hash in production
        role,
        createdAt: new Date().toISOString(),
        createdBy: user?.email
      });
      alert(`${role} profile created successfully!`);
    } catch (err) {
      console.error("Error creating profile:", err);
      alert("Failed to create profile.");
    }
  };

  // 🔹 Loading state
  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  // 🔹 Access denied if no admin doc
  console.log("Auth user:", user?.uid);
  console.log("Admin data:", adminData);
  if (!adminData) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">Access Denied</p>
        <p className="text-gray-600 mt-2">No admin record found. Please contact system administrator.</p>
      </div>
    );
  }

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
              {(adminData?.stats?.pendingApplications || 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {adminData.stats.pendingApplications}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminData?.systemAlerts?.length ? (
                  adminData.systemAlerts.map((alert: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-800">{alert.message}</p>
                        <Badge>{alert.priority}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No system alerts yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <RegistrationApproval />
          </TabsContent>

          {/* Users Tab → Create Teachers, Students, Parents */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Create student, teacher, and parent profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => createUserProfile('student', 'John Doe', '123456')}>
                  ➕ Create Student Profile
                </Button>
                <Button onClick={() => createUserProfile('teacher', 'Jane Smith', 'teacher123')}>
                  ➕ Create Teacher Profile
                </Button>
                <Button onClick={() => createUserProfile('parent', 'Mr. Adams', 'parent123')}>
                  ➕ Create Parent Profile
                </Button>
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
