"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TimetableCard from "./TimetableCard";

/* ---------------- Types ---------------- */
interface TeacherProfile {
  firstName?: string;
  lastName?: string;
  subject?: string;
  status?: string;
  classActivated?: boolean;
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

  const [courses, setCourses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"classroom" | "timetable">("classroom");

  /* ---------------- Listen to Teacher Profile ---------------- */
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingProfile(true);

    const unsub = onSnapshot(
      doc(db, "teachers", user.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as TeacherProfile) : null);
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );

    return () => unsub();
  }, [user?.uid]);

  /* ---------------- Load Courses (from Firestore sync) ---------------- */
  useEffect(() => {
    if (!user?.uid) return;

    const qCourses = query(
      collection(db, "users", user.uid, "classroom", "courses"),
      orderBy("name")
    );
    const unsubCourses = onSnapshot(qCourses, (snap) =>
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => unsubCourses();
  }, [user?.uid]);

  /* ---------------- Load Timetable (principal-created) ---------------- */
  useEffect(() => {
    if (!profile?.subject) return;

    const qTT = query(
      collection(db, "timetable"),
      where("subject", "==", profile.subject),
      orderBy("day")
    );
    const unsubTT = onSnapshot(qTT, (snap) =>
      setTimetable(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) })))
    );

    return () => unsubTT();
  }, [profile?.subject]);

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

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center py-4">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-6 border-t bg-gray-100 py-2">
          {["classroom", "timetable"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "classroom" | "timetable")}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full flex-grow p-6">
        {activeTab === "classroom" && (
          <div className="grid gap-4">
            {courses.length === 0 ? (
              <p className="text-gray-600">No courses synced yet.</p>
            ) : (
              courses.map((c) => (
                <Card key={c.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-gray-600">{c.section || ""}</p>
                  </div>
                  <a
                    href={c.alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      Join Classroom
                    </Button>
                  </a>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "timetable" && (
          <div className="space-y-3">
            {/* ✅ Use TimetableCard with subject filter */}
            <TimetableCard grade="all" subject={profile.subject!} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
