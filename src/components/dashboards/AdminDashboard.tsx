// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, Settings, UserCheck, Trash2, Plus } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { createUserProfile, deleteUserProfile } from "@/lib/firebaseFunctions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import TestComponent from "@/components/admin/TestComponent";

const roleColors: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-800",
  student: "bg-green-100 text-green-800",
  parent: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 👥 Store all users
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // 🔍 Search + filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // 📑 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // 🔄 Sorting state
  const [sortField, setSortField] = useState<"name" | "email" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ➕ Modal State
  const [openModal, setOpenModal] = useState(false);
  const [newRole, setNewRole] = useState("teacher");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [extraField, setExtraField] = useState("");

  // 🔄 Load admin profile
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const adminDocRef = doc(db, "admins", user.uid);

    const fetchData = async () => {
      try {
        const docSnap = await getDoc(adminDocRef);

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

    const unsubscribe = onSnapshot(adminDocRef, (docSnap) =>
      setAdminData(docSnap.exists() ? docSnap.data() : null)
    );

    return () => unsubscribe();
  }, [user]);

  // 👥 Load all users from Firestore
  useEffect(() => {
    const roles = ["teachers", "students", "parents", "admins"];
    const unsubscribers: (() => void)[] = [];

    roles.forEach((role) => {
      const q = collection(db, role);
      const unsub = onSnapshot(q, (snap) => {
        setAllUsers((prev) => {
          const filtered = prev.filter((u) => u.role !== role.slice(0, -1));
          const updated = snap.docs.map((d) => ({
            ...d.data(),
            role: role.slice(0, -1),
          }));
          return [...filtered, ...updated];
        });
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((u) => u());
  }, []);

  // 🔄 Filter + Sort users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = (a[sortField] || "").toLowerCase();
    const bVal = (b[sortField] || "").toLowerCase();
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // 📑 Paginated users
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

  // ➕ Create new user
  const handleSubmitCreateUser = async () => {
    try {
      const extraData =
        newRole === "teacher"
          ? { subject: extraField }
          : newRole === "student"
          ? { grade: extraField }
          : {};

      await createUserProfile(
        newRole as "teacher" | "student" | "parent" | "admin",
        newEmail,
        newPassword,
        newName,
        extraData
      );

      alert(`${newRole} created successfully!`);
      setOpenModal(false);
      setNewRole("teacher");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setExtraField("");
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    }
  };

  // 🗑️ Delete user
  const handleDeleteUser = async (uid: string, role: string, name: string) => {
    if (!window.confirm(`Delete ${role} "${name}"?`)) return;
    try {
      await deleteUserProfile(uid, role as any);
      alert(`${role} ${name} deleted successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;

  if (!adminData) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">Access Denied</p>
        <p className="text-gray-600 mt-2">
          No admin record found. Please contact system administrator.
        </p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4" /> Overview
            
             {/* <TestComponent /> */}
            </TabsTrigger>
            <TabsTrigger value="registrations"><UserCheck className="w-4 h-4" /> Registrations</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>All system users</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 🔍 Search + Filter + Create */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-1/2 px-3 py-2 border rounded-lg"
                  />

                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full sm:w-40 px-3 py-2 border rounded-lg"
                    >
                      <option value="">All Roles</option>
                      {Object.keys(roleColors).map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>

                    <Button variant="outline" onClick={() => setOpenModal(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Create User
                    </Button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => (
                        <tr key={u.uid} className="border-t">
                          <td className="px-4 py-2">{u.name}</td>
                          <td className="px-4 py-2">{u.email}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                roleColors[u.role] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(u.uid, u.role, u.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ➕ Create User Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.keys(roleColors).map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Full Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {(newRole === "teacher" || newRole === "student") && (
              <div>
                <Label>{newRole === "teacher" ? "Subject" : "Grade"}</Label>
                <Input value={extraField} onChange={(e) => setExtraField(e.target.value)} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmitCreateUser}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
