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

interface ClassroomLink {
  id: string;
  subject: string;
  link: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:00 AM"
  duration: number;
  teacherName: string;
}

/* ============================================================
   🔹 Helper Function: Normalize Grade
   Converts "8" → "Grade 8" for matching timetable docs
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

  const [classrooms, setClassrooms] = useState<ClassroomLink[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<
    Record<string, { googleClassroomLink?: string; zoomLink?: string }>
  >({});
  const [activeTab, setActiveTab] = useState<
    "overview" | "classroom" | "timetable"
  >("overview");

  /* ============================================================
     🔹 Fetch Student Profile (Realtime)
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

        // Real-time updates for student data
        const unsub = onSnapshot(doc(db, "students", docSnap.id), (s) => {
          if (s.exists()) {
            setProfile(s.data() as StudentProfile);
          } else {
            setProfile(null);
          }
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
     🔹 Fetch Classroom Links (Realtime)
     ============================================================ */
  useEffect(() => {
    if (!studentId) return;

    const q = collection(db, "students", studentId, "classrooms");
    const unsub = onSnapshot(q, (snap) =>
      setClassrooms(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassroomLink) }))
      )
    );

    return () => unsub();
  }, [studentId]);

  /* ============================================================
     🔹 Fetch Timetable Entries (Realtime) — includes grade normalization
     ============================================================ */
  useEffect(() => {
    if (!profile?.grade) return;

    const normalizedGrade = normalizeGrade(profile.grade);
    console.log("📘 DEBUG: Fetching timetable for normalized grade:", normalizedGrade);

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
          console.log("📘 DEBUG: Timetable snapshot received:", snap.size, "docs");

          if (snap.empty) {
            console.warn("⚠️ No timetable entries found for grade:", normalizedGrade);
          }

          const entries = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as TimetableEntry),
          }));
          setTimetable(entries);

          // Fetch teacher links
          const teacherNames = Array.from(new Set(entries.map((e) => e.teacherName)));
          const links: Record<
            string,
            { googleClassroomLink?: string; zoomLink?: string }
          > = {};

          for (const name of teacherNames) {
            const [first, last] = name.split(" ");
            if (!first || !last) continue;

            try {
              const tq = query(
                collection(db, "teachers"),
                where("firstName", "==", first),
                where("lastName", "==", last)
              );
              const tSnap = await getDocs(tq);

              if (tSnap.empty) {
                console.warn("⚠️ No teacher found for:", name);
                continue;
              }

              const data = tSnap.docs[0].data();
              links[name] = {
                googleClassroomLink: data.googleClassroomLink,
                zoomLink: data.zoomLink,
              };

              console.log("📘 DEBUG: Found teacher:", name, "→", links[name]);
            } catch (teacherErr: any) {
              console.error("❌ Teacher fetch error for:", name, teacherErr.message);
            }
          }

          setTeacherLinks(links);
        },
        (error) => {
          console.error("❌ Firestore timetable listener error:", error.message);
          if (error.code === "permission-denied") {
            console.error("🚫 Permission denied: Check Firestore rules for 'timetable'.");
          } else if (error.message.includes("index")) {
            console.warn("⚠️ Missing index: Create index link should appear above ⬆️");
          }
        }
      );

      return () => unsubTT();
    } catch (err: any) {
      console.error("❌ Timetable setup failed:", err.message);
    }
  }, [profile?.grade]);

  /* ============================================================
     🔹 Compute Next Upcoming Class
     ============================================================ */
  const nextClass = useMemo(() => {
    const now = new Date();
    const upcoming = timetable
      .map((t) => ({
        ...t,
        datetime: new Date(`${t.date} ${t.time}`),
      }))
      .filter((t) => t.datetime > now)
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

    return upcoming[0] || null;
  }, [timetable]);

  /* ============================================================
     🔹 Countdown Timer for Next Class
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
          hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : `${minutes}m ${seconds}s`;

        setCountdown(`⏳ Starts in ${timeStr}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextClass]);

  /* ============================================================
     🔹 Guards
     ============================================================ */
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
        No student profile found. Please contact your school.
      </div>
    );
  }

  /* ============================================================
     🔹 Logout
     ============================================================ */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ============================================================
     🔹 UI
     ============================================================ */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ---------------- Header ---------------- */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center py-4">
          <h1 className="text-xl font-bold">Student Dashboard</h1>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Logout
          </Button>
        </div>

        {/* ---------------- Tabs ---------------- */}
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

      {/* ---------------- Main Content ---------------- */}
      <div className="max-w-6xl mx-auto w-full flex-grow p-6">
        {/* 🔹 Overview Tab */}
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

      {/* 🔹 Classroom Tab (Auto from timetable + teachers) */}
{activeTab === "classroom" && (
  <div className="grid gap-4">
    {timetable.length === 0 ? (
      <p className="text-gray-600">No classes scheduled yet.</p>
    ) : (
      timetable.map((cls) => {
        const teacher = teacherLinks[cls.teacherName];
        const classroomLink = teacher?.googleClassroomLink;
        const zoomLink = teacher?.zoomLink;

        return (
          <Card
            key={cls.id}
            className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div>
              <h3 className="font-semibold text-blue-800">
                {cls.subject}
              </h3>
              <p className="text-sm text-gray-600">
                {cls.teacherName} • {cls.grade}
              </p>
              <p className="text-xs text-gray-500">
                {cls.date} • {cls.time} ({cls.duration} mins)
              </p>
            </div>

            <div className="flex gap-3 mt-3 md:mt-0">
              {classroomLink && (
                <a
                  href={classroomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-600 hover:bg-green-700 text-white text-xs">
                    Google Classroom
                  </Button>
                </a>
              )}
              {zoomLink && (
                <a
                  href={zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Zoom
                  </Button>
                </a>
              )}
              {!classroomLink && !zoomLink && (
                <p className="text-xs text-gray-400 italic">
                  No links available yet.
                </p>
              )}
            </div>
          </Card>
        );
      })
    )}
  </div>
)}


        {/* 🔹 Timetable Tab */}
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

                {/* 🔗 Links */}
                <div className="flex gap-3 mt-3">
                  {teacherLinks[nextClass.teacherName]?.googleClassroomLink && (
                    <a
                      href={teacherLinks[nextClass.teacherName]?.googleClassroomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-green-600 hover:bg-green-700 text-white text-xs">
                        Google Classroom
                      </Button>
                    </a>
                  )}
                  {teacherLinks[nextClass.teacherName]?.zoomLink && (
                    <a
                      href={teacherLinks[nextClass.teacherName]?.zoomLink}
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

            {/* Full Timetable */}
            <TimetableCard grade={normalizeGrade(profile.grade!)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
