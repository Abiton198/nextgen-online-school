"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TimetableCard from "./TimetableCard";

/* ---------------- Types ---------------- */
interface StudentProfile {
  firstName?: string;
  lastName?: string;
  grade?: string;
  parentName?: string;
  points?: number;
  lessonsCompleted?: number;
}

interface ClassroomLink {
  id: string;
  subject: string;
  link: string;
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

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [classrooms, setClassrooms] = useState<ClassroomLink[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "classroom" | "timetable">("overview");

  /* ---------------- Listen to Student Profile ---------------- */
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingProfile(true);

    const unsub = onSnapshot(
      doc(db, "students", user.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as StudentProfile) : null);
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );

    return () => unsub();
  }, [user?.uid]);

  /* ---------------- Load Classroom Links ---------------- */
  useEffect(() => {
    if (!user?.uid) return;

    const q = collection(db, "students", user.uid, "classrooms");
    const unsub = onSnapshot(q, (snap) =>
      setClassrooms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassroomLink) })))
    );

    return () => unsub();
  }, [user?.uid]);

  /* ---------------- Load Timetable ---------------- */
  useEffect(() => {
    if (!profile?.grade) return;

    const qTT = query(
      collection(db, "timetable"),
      where("grade", "==", profile.grade),
      orderBy("day")
    );
    const unsubTT = onSnapshot(qTT, (snap) =>
      setTimetable(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) })))
    );

    return () => unsubTT();
  }, [profile?.grade]);

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
        No student profile found.
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
          <h1 className="text-xl font-bold">Student Dashboard</h1>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-6 border-t bg-gray-100 py-2">
          {["overview", "classroom", "timetable"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
        {activeTab === "overview" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">
              Welcome {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-gray-600">Grade: {profile.grade}</p>
            <p className="text-sm text-gray-600">
              Lessons Completed: {profile.lessonsCompleted || 0}
            </p>
            <p className="text-sm text-gray-600">
              Points: {profile.points || 0}
            </p>
          </Card>
        )}

        {activeTab === "classroom" && (
          <div className="grid gap-4">
            {classrooms.length === 0 ? (
              <p className="text-gray-600">No classroom links yet.</p>
            ) : (
              classrooms.map((c) => (
                <Card key={c.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{c.subject}</h3>
                  </div>
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
            {/* ✅ Use TimetableCard directly for the student’s grade */}
            <TimetableCard grade={profile.grade!} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
