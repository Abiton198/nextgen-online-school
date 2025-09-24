import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Type for child records
interface ChildRecord {
  id?: string;
  name: string;
  grade: string;
  dob?: string;
  attendance?: number;
  averageGrade?: string;
  points?: number;
}

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [activeSection, setActiveSection] = useState<string>("overview");

  // ---------------- Live Firestore Data ----------------
  useEffect(() => {
    if (!user?.uid) return;

    // Listen for children under this parent
    const unsub = onSnapshot(
      collection(db, "parents", user.uid, "children"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ChildRecord[];
        setChildren(list);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  // ---------------- Register Child ----------------
  const registerChild = async () => {
    if (!user?.uid) return;
    const childRef = collection(db, "parents", user.uid, "children");
    await addDoc(childRef, {
      name: "New Child",
      grade: "Grade 1",
      dob: "",
      attendance: 0,
      averageGrade: "",
      points: 0,
      createdAt: new Date().toISOString(),
    });
  };

  // ---------------- Section Components ----------------
  const renderOverview = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Children Overview</h2>
      {children.length === 0 ? (
        <p className="text-gray-500 mb-4">No children registered yet.</p>
      ) : (
        children.map((child) => (
          <Card key={child.id} className="mb-4">
            <CardHeader>
              <CardTitle>{child.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Grade: {child.grade}</p>
              <p>Attendance: {child.attendance ?? 0}%</p>
              <p>Points: {child.points ?? 0}</p>
            </CardContent>
          </Card>
        ))
      )}
      <Button onClick={registerChild} className="bg-green-600 hover:bg-green-700">
        + Register Child
      </Button>
    </div>
  );

  const renderSubscription = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Subscription & Fees</h2>
      <p className="text-gray-600">Coming soon: live invoices and payment portal.</p>
    </div>
  );

  const renderCalendar = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Calendar</h2>
      <p className="text-gray-600">Events calendar will sync here.</p>
    </div>
  );

  const renderEvents = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Events & Announcements</h2>
      <p className="text-gray-600">School-wide announcements will appear here.</p>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <p className="text-gray-600">Profile settings for parent account.</p>
    </div>
  );

  const renderChats = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">Chats & Communication</h2>
      <p className="text-gray-600">Secure messaging with teachers and school staff.</p>
    </div>
  );

  // ---------------- Dashboard Layout ----------------
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

      {/* Sidebar Nav */}
      <div className="max-w-7xl mx-auto flex">
        <aside className="w-64 bg-white shadow-md p-4">
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Child Info" },
              { id: "subscription", label: "Subscription & Fees" },
              { id: "calendar", label: "Calendar" },
              { id: "events", label: "Events & Announcements" },
              { id: "settings", label: "Settings" },
              { id: "chats", label: "Chats" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeSection === item.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeSection === "overview" && renderOverview()}
          {activeSection === "subscription" && renderSubscription()}
          {activeSection === "calendar" && renderCalendar()}
          {activeSection === "events" && renderEvents()}
          {activeSection === "settings" && renderSettings()}
          {activeSection === "chats" && renderChats()}
        </main>
      </div>
    </div>
  );
};

export default ParentDashboard;
