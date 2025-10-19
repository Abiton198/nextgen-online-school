"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TimetableCard from "./TimetableCard";

/* ============================================================
   🔹 Type Definitions
   ============================================================ */
interface StudentProfile {
  firstName?: string;
  lastName?: string;
  grade?: string;
  parentName?: string;
  points?: number;
  lessonsCompleted?: number;
  email?: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  teacherName: string;
}

/* ============================================================
   🔹 Helper Function
   ============================================================ */
const normalizeGrade = (g?: string) => {
  if (!g) return "";
  return g.startsWith("Grade") ? g : `Grade ${g}`;
};

/* ============================================================
   🔹 Student Dashboard Component
   ============================================================ */
const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<
    Record<string, { googleClassroomLink?: string; zoomLink?: string }>
  >({});
  const [activeTab, setActiveTab] = useState<
    "overview" | "classroom" | "timetable"
  >("overview");

  /* ============================================================
     🔹 Fetch Student Profile
     ============================================================ */
  useEffect(() => {
    if (!user?.email) return;
    setLoadingProfile(true);

    const q = query(collection(db, "students"), where("email", "==", user.email));
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setStudentId(docSnap.id);
        setProfile(docSnap.data() as StudentProfile);

        const unsub = onSnapshot(doc(db, "students", docSnap.id), (s) => {
          if (s.exists()) setProfile(s.data() as StudentProfile);
          else setProfile(null);
          setLoadingProfile(false);
        });
        return unsub;
      } else {
        setProfile(null);
        setLoadingProfile(false);
      }
    });
  }, [user?.email]);

  /* ============================================================
     🔹 Fetch Timetable + Teacher Links
     ============================================================ */
  useEffect(() => {
    if (!profile?.grade) return;

    const normalizedGrade = normalizeGrade(profile.grade);
    console.log("📘 DEBUG: Fetching timetable for grade:", normalizedGrade);

    try {
      const qTT = query(
        collection(db, "timetable"),
        where("grade", "==", normalizedGrade),
        orderBy("date"),
        orderBy("time")
      );

      const unsubTT = onSnapshot(
        qTT,
        async (snap) => {
          const entries = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as TimetableEntry),
          }));
          setTimetable(entries);
          console.log("📘 Timetable snapshot:", entries.length, "entries");

          const subjects = Array.from(new Set(entries.map((e) => e.subject.trim())));
          const links: Record<string, { googleClassroomLink?: string; zoomLink?: string }> = {};

          for (const subject of subjects) {
            const normalized = subject.toLowerCase().trim();
            console.log("🔍 Looking for teacher with subject:", normalized);

            try {
              // Try both possible field types
              const tqSingle = query(
                collection(db, "teachers"),
                where("subject", "==", subject)
              );
              const tqArray = query(
                collection(db, "teachers"),
                where("subjects", "array-contains", subject)
              );

              // Run both and merge results
              const [snapSingle, snapArray] = await Promise.all([
                getDocs(tqSingle),
                getDocs(tqArray),
              ]);

              const combinedDocs = [...snapSingle.docs, ...snapArray.docs];

              if (combinedDocs.length === 0) {
                console.warn("⚠️ No teacher found for subject:", subject);
                continue;
              }

              const data = combinedDocs[0].data();
              links[subject] = {
                googleClassroomLink: data.googleClassroomLink,
                zoomLink: data.zoomLink,
              };

              console.log("✅ Found teacher link for", subject, "→", links[subject]);
            } catch (err: any) {
              console.error("❌ Teacher fetch error for subject:", subject, err.message);
            }
          }

          setTeacherLinks(links);
        },
        (error) => {
          console.error("❌ Firestore timetable listener error:", error.message);
        }
      );

      return () => unsubTT();
    } catch (err: any) {
      console.error("❌ Timetable setup failed:", err.message);
    }
  }, [profile?.grade]);

  /* ============================================================
     🔹 Next Class
     ============================================================ */
  const nextClass = useMemo(() => {
    const now = new Date();
    const upcoming = timetable
      .map((t) => ({ ...t, datetime: new Date(`${t.date} ${t.time}`) }))
      .filter((t) => t.datetime > now)
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    return upcoming[0] || null;
  }, [timetable]);

  /* ============================================================
     🔹 Countdown Timer
     ============================================================ */
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!nextClass) {
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const classTime = new Date(`${nextClass.date} ${nextClass.time}`);
      const diff = classTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("🟢 Class in progress");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const timeStr =
          hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
        setCountdown(`⏳ Starts in ${timeStr}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextClass]);

  /* ============================================================
     🔹 Logout
     ============================================================ */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ============================================================
     🔹 Guards
     ============================================================ */
  if (!user)
    return <div className="min-h-screen flex items-center justify-center">Please sign in.</div>;

  if (loadingProfile)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile...
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        No student profile found. Please contact your school.
      </div>
    );

  /* ============================================================
     🔹 UI
     ============================================================ */
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
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto w-full flex-grow p-6">
        {/* 🔹 Overview */}
        {activeTab === "overview" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">
              Welcome {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-gray-600">Grade: {profile.grade}</p>
            <p className="text-sm text-gray-600">
              Lessons Completed: {profile.lessonsCompleted || 0}
            </p>
            <p className="text-sm text-gray-600">Points: {profile.points || 0}</p>
          </Card>
        )}

      
     {/* 🔹 Classroom Tab */}
{activeTab === "classroom" && (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-blue-700">🧑‍🏫 My Classrooms</h2>
    <p className="text-gray-600 mb-2">
      Access your subject classrooms and virtual sessions.  
      If a link isn’t available yet, it will appear as “Pending”.
    </p>

    {timetable.length === 0 ? (
      <p className="text-gray-500 italic">No subjects found for your grade.</p>
    ) : (
      Array.from(new Map(timetable.map((cls) => [cls.subject, cls])).values()).map((cls) => {
        const teacher = teacherLinks?.[cls.subject];
        const classroomLink = teacher?.googleClassroomLink;
        const zoomLink = teacher?.zoomLink;
        const hasAnyLink = classroomLink?.trim() || zoomLink?.trim();

        return (
          <Card
            key={cls.subject}
            className={`p-5 border-l-4 ${
              hasAnyLink ? "border-blue-500" : "border-gray-300"
            } bg-white shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between`}
          >
            <div>
              <h3 className="font-semibold text-blue-800 text-lg">{cls.subject}</h3>
              <p className="text-sm text-gray-700">
                {cls.teacherName} • {cls.grade}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 sm:mt-0">
              {classroomLink ? (
                <a href={classroomLink} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700 text-white text-xs">
                    Google Classroom
                  </Button>
                </a>
              ) : (
                <Button
                  disabled
                  className="bg-gray-300 text-gray-600 text-xs cursor-not-allowed"
                >
                  Classroom Pending
                </Button>
              )}

              {zoomLink ? (
                <a href={zoomLink} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Zoom
                  </Button>
                </a>
              ) : (
                <Button
                  disabled
                  className="bg-gray-300 text-gray-600 text-xs cursor-not-allowed"
                >
                  Zoom Pending
                </Button>
              )}
            </div>
          </Card>
        );
      })
    )}
  </div>
)}


        {/* 🔹 Timetable */}
        {activeTab === "timetable" && (
          <div className="space-y-4">
            {nextClass ? (
              <Card
                className={`p-5 border-l-4 shadow-sm ${
                  countdown.includes("Starts in") &&
                  countdown.match(/\d+m/) &&
                  parseInt(countdown.match(/\d+m/)?.[0]) <= 10
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-blue-500 bg-blue-50"
                }`}
              >
                <h3 className="font-semibold text-blue-800 mb-1">
                  🎯 Next Class: {nextClass.subject}
                </h3>
                <p className="text-sm text-gray-700">
                  {new Date(nextClass.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  • {nextClass.time} ({nextClass.duration} mins)
                </p>
                <p className="text-sm text-gray-700">Teacher: {nextClass.teacherName}</p>
                <p className="text-sm font-medium mt-1 text-green-700">{countdown}</p>

                <div className="flex gap-3 mt-3">
                  {teacherLinks[nextClass.subject]?.googleClassroomLink && (
                    <a
                      href={teacherLinks[nextClass.subject]?.googleClassroomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-green-600 hover:bg-green-700 text-white text-xs">
                        Google Classroom
                      </Button>
                    </a>
                  )}
                  {teacherLinks[nextClass.subject]?.zoomLink && (
                    <a
                      href={teacherLinks[nextClass.subject]?.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                        Zoom
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No upcoming classes found for your grade.
              </p>
            )}

            <TimetableCard grade={normalizeGrade(profile.grade!)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
