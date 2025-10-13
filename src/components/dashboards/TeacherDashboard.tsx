"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Settings, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TimetableCard from "./TimetableCard";

/* ---------------- Types ---------------- */
interface TeacherProfile {
  firstName?: string;
  lastName?: string;
  subject?: string;
  status?: string;
  classActivated?: boolean;
  zoomLink?: string;
  googleClassroomLink?: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  day: string;
  time: string;
  duration: number;
  teacherName: string;
  googleClassroomLink: string;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"classroom" | "timetable" | "settings">("classroom");

  const [showEditModal, setShowEditModal] = useState(false);
  const [tempZoom, setTempZoom] = useState("");
  const [tempClassroom, setTempClassroom] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------------- Fetch Teacher Profile ---------------- */
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingProfile(true);

    const unsub = onSnapshot(
      doc(db, "teachers", user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TeacherProfile;
          setProfile(data);
          setTempZoom(data.zoomLink || "");
          setTempClassroom(data.googleClassroomLink || "");
        } else {
          setProfile(null);
        }
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );

    return () => unsub();
  }, [user?.uid]);

  /* ---------------- Guards ---------------- */
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please sign in.</div>;
  }
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile...
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        No teacher profile found. Please complete your application.
      </div>
    );
  }
  if (profile.status !== "approved" || !profile.classActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-600">
        Your application is {profile.status}. Waiting for class activation.
      </div>
    );
  }

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ---------------- Save Settings ---------------- */
  const handleSaveSettings = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "teachers", user.uid), {
        zoomLink: tempZoom,
        googleClassroomLink: tempClassroom,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating teacher settings:", err);
      alert("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center py-4">
          <div>
            <h1 className="text-xl font-bold text-blue-700">
              Welcome Ms. {profile.lastName || profile.firstName}
            </h1>
            <p className="text-gray-600 text-sm">
              Subject: <span className="font-medium">{profile.subject}</span>
            </p>
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 border-t bg-gray-100 py-2">
          {["classroom", "timetable", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "classroom" | "timetable" | "settings")}
              className={`px-4 py-2 rounded transition ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full flex-grow p-6">
        {/* CLASSROOM TAB */}
        {activeTab === "classroom" && (
          <Card className="p-6 shadow-sm border bg-white">
            <h2 className="text-lg font-semibold mb-4">🧑‍🏫 Classroom Links</h2>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <p className="font-medium">Zoom Meeting</p>
                  <p className="text-sm text-gray-600">For live classes or virtual sessions.</p>
                </div>
                <Button
                  onClick={() => {
                    if (profile.zoomLink) window.open(profile.zoomLink, "_blank");
                    else alert("No Zoom link available.");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Join Zoom
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <p className="font-medium">Google Classroom</p>
                  <p className="text-sm text-gray-600">
                    Access your classroom resources and assignments.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (profile.googleClassroomLink)
                      window.open(profile.googleClassroomLink, "_blank");
                    else alert("No Google Classroom link available.");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Enter Classroom
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-3">
            <TimetableCard grade="all" subject={profile.subject!} />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <Card className="p-6 bg-white shadow-sm border relative">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">⚙️ Account Settings</h2>
              <Button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Settings className="w-4 h-4" /> Edit
              </Button>
            </div>
            <p className="text-gray-700 mb-2">
              <strong>Name:</strong> {profile.firstName} {profile.lastName}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Subject:</strong> {profile.subject}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Zoom Link:</strong>{" "}
              {profile.zoomLink ? (
                <a href={profile.zoomLink} target="_blank" className="text-blue-600 underline">
                  {profile.zoomLink}
                </a>
              ) : (
                <span className="text-gray-500">Not set</span>
              )}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Google Classroom:</strong>{" "}
              {profile.googleClassroomLink ? (
                <a
                  href={profile.googleClassroomLink}
                  target="_blank"
                  className="text-green-600 underline"
                >
                  {profile.googleClassroomLink}
                </a>
              ) : (
                <span className="text-gray-500">Not set</span>
              )}
            </p>
          </Card>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-4 text-center text-blue-700">
              Update Classroom Links
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zoom Link
                </label>
                {/* zoom link */}
                <input
                  type="url"
                  value={tempZoom}
                  onChange={(e) => setTempZoom(e.target.value)}
                  placeholder="https://us05web.zoom.us/j/8613739793?pwd=Lwj6XbILVUpQbpufriNsFbtk2zE0SZ.1&omn=87576706234"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Classroom Link
                </label>

                {/* google classroom link */}
                <input
                  type="url"
                  value={tempClassroom}
                  onChange={(e) => setTempClassroom(e.target.value)}
                  placeholder="https://classroom.google.com/c/ODE3OTM5MTUyNTY0"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
