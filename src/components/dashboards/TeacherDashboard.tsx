"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import {
  Loader2,
  Settings,
  X,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  day: string;        // e.g. "Monday"
  time: string;       // e.g. "03:00 PM"
  duration: number;
  teacherName: string;
  curriculum: "CAPS" | "Cambridge";
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"classroom" | "timetable" | "settings">("timetable");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [tempZoom, setTempZoom] = useState("");
  const [tempClassroom, setTempClassroom] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------------- Full Teacher Name ---------------- */
  const teacherFullName = useMemo(() => {
    if (!profile?.firstName || !profile?.lastName) return "";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile?.firstName, profile?.lastName]);

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

  /* ---------------- Fetch Teacher's Timetable (Real-Time) ---------------- */
  useEffect(() => {
    if (!teacherFullName || !profile?.subject) {
      setTimetable([]);
      setLoadingTimetable(false);
      return;
    }

    setLoadingTimetable(true);

    const q = query(
      collection(db, "timetable"),
      orderBy("day"),
      orderBy("time")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const allEntries = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as TimetableEntry) }) as TimetableEntry
        );

        // Filter: exact teacher name OR subject match
        const filtered = allEntries.filter((entry) => {
          const nameMatch = entry.teacherName.toLowerCase() === teacherFullName.toLowerCase();
          const subjectMatch = entry.subject.toLowerCase() === profile.subject?.toLowerCase();
          return nameMatch || subjectMatch;
        });

        // Sort by day order
        const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const sorted = filtered.sort((a, b) => {
          const dayA = dayOrder.indexOf(a.day);
          const dayB = dayOrder.indexOf(b.day);
          if (dayA !== dayB) return dayA - dayB;
          return a.time.localeCompare(b.time);
        });

        setTimetable(sorted);
        setLoadingTimetable(false);
      },
      (error) => {
        console.error("Timetable fetch error:", error);
        setLoadingTimetable(false);
      }
    );

    return () => unsub();
  }, [teacherFullName, profile?.subject]);

  /* ---------------- Group by Day ---------------- */
  const groupedByDay = useMemo(() => {
    const groups: Record<string, TimetableEntry[]> = {};
    timetable.forEach((entry) => {
      if (!groups[entry.day]) groups[entry.day] = [];
      groups[entry.day].push(entry);
    });
    return Object.entries(groups);
  }, [timetable]);

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
        zoomLink: tempZoom || null,
        googleClassroomLink: tempClassroom || null,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Guards ---------------- */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Please sign in.
      </div>
    );
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
        No teacher profile found.
      </div>
    );
  }

  if (profile.status !== "approved" || !profile.classActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-600">
        Your account is pending approval.
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center py-4">
          <div>
            <h1 className="text-xl font-bold text-blue-700">
              {profile.firstName} {profile.lastName}
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
          {["timetable", "classroom", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded transition capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full flex-grow p-6">
        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
              My Weekly Schedule
            </h2>

            {loadingTimetable ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading your timetable...
              </div>
            ) : groupedByDay.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">
                No classes scheduled this week.
              </p>
            ) : (
              groupedByDay.map(([day, slots]) => (
                <div key={day} className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {day}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot) => (
                      <Card
                        key={slot.id}
                        className={`p-4 border-l-4 ${
                          slot.curriculum === "CAPS"
                            ? "border-green-500 bg-green-50"
                            : "border-blue-500 bg-blue-50"
                        } hover:shadow-md transition-shadow`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-semibold text-gray-800">
                            <BookOpen className="w-4 h-4" />
                            {slot.subject}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <GraduationCap className="w-4 h-4" />
                            {slot.grade}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="w-4 h-4" />
                            {slot.time} ({slot.duration} min)
                          </div>
                          <div className="text-xs font-medium mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-white ${
                                slot.curriculum === "CAPS" ? "bg-green-600" : "bg-blue-600"
                              }`}
                            >
                              {slot.curriculum}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {profile.zoomLink && (
                            <a href={profile.zoomLink} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                                Zoom
                              </Button>
                            </a>
                          )}
                          {profile.googleClassroomLink && (
                            <a href={profile.googleClassroomLink} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                                Classroom
                              </Button>
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CLASSROOM TAB */}
        {activeTab === "classroom" && (
          <Card className="p-6 shadow-sm border bg-white">
            <h2 className="text-lg font-semibold mb-4">Classroom Links</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <p className="font-medium">Zoom Meeting</p>
                  <p className="text-sm text-gray-600">Start or join live classes.</p>
                </div>
                <Button
                  onClick={() =>
                    profile.zoomLink
                      ? window.open(profile.zoomLink, "_blank")
                      : alert("No Zoom link set.")
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Join Zoom
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <p className="font-medium">Google Classroom</p>
                  <p className="text-sm text-gray-600">Assignments, materials, and grades.</p>
                </div>
                <Button
                  onClick={() =>
                    profile.googleClassroomLink
                      ? window.open(profile.googleClassroomLink, "_blank")
                      : alert("No Classroom link set.")
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  Open Classroom
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <Card className="p-6 bg-white shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Account Settings</h2>
              <Button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4" /> Edit Links
              </Button>
            </div>

            <div className="space-y-3 text-gray-700">
              <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Subject:</strong> {profile.subject}</p>
              <p>
                <strong>Zoom:</strong>{" "}
                {profile.zoomLink ? (
                  <a href={profile.zoomLink} target="_blank" className="text-blue-600 underline">
                    {profile.zoomLink}
                  </a>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </p>
              <p>
                <strong>Classroom:</strong>{" "}
                {profile.googleClassroomLink ? (
                  <a href={profile.googleClassroomLink} target="_blank" className="text-green-600 underline">
                    {profile.googleClassroomLink}
                  </a>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-700">Update Links</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zoom Link</label>
                <input
                  type="url"
                  value={tempZoom}
                  onChange={(e) => setTempZoom(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Google Classroom</label>
                <input
                  type="url"
                  value={tempClassroom}
                  onChange={(e) => setTempClassroom(e.target.value)}
                  placeholder="https://classroom.google.com/..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
                className="bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
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