"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  LogOut,
  Calendar,
  Clock,
  BookOpen,
  User,
  ExternalLink,
  Video,
  FileText,
  Moon,
  Sun,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ============================================================
   Types
   ============================================================ */
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  subjects: string[];
  parentId: string;
  email?: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  day: string;
  time: string;
  duration: number;
  teacherName: string;
  curriculum: "CAPS" | "Cambridge";
}

interface TeacherLink {
  zoomLink?: string;
  googleClassroomLink?: string;
}

/* ============================================================
   Student Dashboard
   ============================================================ */
const StudentDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<Record<string, TeacherLink>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timetable" | "classlinks" | "homework">("timetable");
  const [isDark, setIsDark] = useState(false);

  /* ============================================================
     Fetch Student Profile
     ============================================================ */
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "students", studentId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Student;
        setStudent({ ...data, id: snap.id });
      } else {
        setStudent(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [studentId]);

  /* ============================================================
     Fetch Timetable + Teacher Links
     ============================================================ */
  useEffect(() => {
    if (!student?.grade || !student?.subjects?.length) return;

    const gradeNorm = student.grade.replace(/^grade\s*/i, "").trim();

    const q = query(
      collection(db, "timetable"),
      where("grade", "==", student.grade),
      orderBy("day"),
      orderBy("time")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimetableEntry));
      setTimetable(entries);

      const links: Record<string, TeacherLink> = {};
      const subjectSet = new Set(student.subjects);

      for (const subject of subjectSet) {
        const tq = query(
          collection(db, "teachers"),
          where("subject", "==", subject),
          where("approved", "==", true)
        );
        const tsnap = await getDocs(tq);
        if (!tsnap.empty) {
          const tdata = tsnap.docs[0].data();
          links[subject] = {
            zoomLink: tdata.zoomLink,
            googleClassroomLink: tdata.googleClassroomLink,
          };
        }
      }

      setTeacherLinks(links);
    });

    return () => unsub();
  }, [student?.grade, student?.subjects]);

  /* ============================================================
     Next Class + Live Indicator
     ============================================================ */
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => now.toLocaleDateString("en-US", { weekday: "long" }), [now]);
  const currentTime = useMemo(() => now.toTimeString().slice(0, 5), [now]);

  const nextClass = useMemo(() => {
    return timetable
      .filter((c) => c.day === today)
      .sort((a, b) => a.time.localeCompare(b.time))
      .find((c) => c.time >= currentTime) || null;
  }, [timetable, today, currentTime]);

  const liveClass = useMemo(() => {
    return timetable
      .filter((c) => c.day === today)
      .find((c) => {
        const [h, m] = c.time.split(":");
        const classStart = new Date();
        classStart.setHours(parseInt(h), parseInt(m), 0, 0);
        const classEnd = new Date(classStart.getTime() + c.duration * 60000);
        return now >= classStart && now <= classEnd;
      }) || null;
  }, [timetable, today, now]);

  /* ============================================================
     Group Timetable by Day
     ============================================================ */
  const groupedTimetable = useMemo(() => {
    const groups: Record<string, TimetableEntry[]> = {};
    timetable.forEach((entry) => {
      if (!groups[entry.day]) groups[entry.day] = [];
      groups[entry.day].push(entry);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });
  }, [timetable]);

  /* ============================================================
     Logout & Back to Parent
     ============================================================ */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const goBackToParent = () => {
    navigate(`/parent-dashboard`);
  };

  /* ============================================================
     Loading & Error
     ============================================================ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8 shadow-lg">
          <h3 className="text-red-600 font-bold text-xl mb-2">Student Not Found</h3>
          <p className="text-gray-600 mb-4">Please check the link or contact your parent.</p>
          <Button onClick={goBackToParent} className="bg-indigo-600">
            Back to Parent Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  /* ============================================================
     UI
     ============================================================ */
  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToParent}
              className="hover:bg-indigo-100"
            >
              <Home size={18} />
              Back to Parent
            </Button>
            <h1 className="text-xl font-bold">
              {student.firstName}'s Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDark(!isDark)}
              className="hover:bg-gray-100"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              <LogOut size={18} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <nav className={`bg-gradient-to-r ${isDark ? "from-gray-800 to-gray-700" : "from-indigo-600 to-purple-600"} text-white`}>
          <div className="max-w-6xl mx-auto px-6 flex gap-1">
            <button
              onClick={() => setActiveTab("timetable")}
              className={`flex-1 py-3 font-medium transition ${
                activeTab === "timetable" ? "bg-white/20" : ""
              } hover:bg-white/10`}
            >
              <Calendar className="inline w-5 h-5 mr-2" />
              Timetable
            </button>
            <button
              onClick={() => setActiveTab("classlinks")}
              className={`flex-1 py-3 font-medium transition ${
                activeTab === "classlinks" ? "bg-white/20" : ""
              } hover:bg-white/10`}
            >
              <FileText className="inline w-5 h-5 mr-2" />
              Class Links
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Live Class Alert */}
        {liveClass && (
          <Card className="border-l-4 border-red-500 bg-red-50 shadow-lg animate-pulse">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                  <Video className="w-5 h-5 animate-pulse" />
                  LIVE CLASS: {liveClass.subject}
                </h3>
                <p className="text-sm text-gray-700">{liveClass.teacherName}</p>
              </div>
              {teacherLinks[liveClass.subject]?.zoomLink ? (
                <a href={teacherLinks[liveClass.subject].zoomLink} target="_blank" rel="noopener">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Join Now
                  </Button>
                </a>
              ) : (
                <Button disabled className="bg-gray-400">No Zoom Link</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Next Class */}
        {nextClass && !liveClass && (
          <Card className="border-l-4 border-yellow-500 bg-yellow-50 shadow-lg">
            <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Next Class: {nextClass.subject}
                </h3>
                <p className="text-sm text-gray-700">
                  {nextClass.day} • {nextClass.time} ({nextClass.duration} min)
                </p>
              </div>
              <div className="flex gap-2">
                {teacherLinks[nextClass.subject]?.zoomLink && (
                  <a href={teacherLinks[nextClass.subject].zoomLink} target="_blank" rel="noopener">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Join Zoom
                    </Button>
                  </a>
                )}
                {teacherLinks[nextClass.subject]?.googleClassroomLink && (
                  <a href={teacherLinks[nextClass.subject].googleClassroomLink} target="_blank" rel="noopener">
                    <Button size="sm" variant="outline">Classroom</Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timetable Tab */}
        {activeTab === "timetable" && (
          <div className="space-y-6">
            {groupedTimetable.length === 0 ? (
              <Card className="text-center p-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No timetable yet</p>
                <p className="text-sm text-gray-500">Classes will appear here soon.</p>
              </Card>
            ) : (
              groupedTimetable.map(([day, slots]) => (
                <Card key={day} className="overflow-hidden shadow-lg">
                  <CardHeader className={`bg-gradient-to-r ${
                    day === today ? "from-red-500 to-pink-600" : "from-indigo-500 to-purple-600"
                  } text-white`}>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {day}
                      {day === today && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">Today</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {slots.map((slot) => {
                        const links = teacherLinks[slot.subject] || {};
                        const isLive = liveClass?.id === slot.id;
                        return (
                          <div
                            key={slot.id}
                            className={`p-5 flex items-center justify-between flex-wrap gap-4 ${
                              isLive ? "bg-red-50 border-2 border-red-300" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex-1">
                              <h4 className={`font-semibold flex items-center gap-2 ${
                                isLive ? "text-red-800" : "text-indigo-800"
                              }`}>
                                <BookOpen className="w-4 h-4" />
                                {slot.subject}
                                {isLive && <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">LIVE</span>}
                              </h4>
                              <p className="text-sm text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {slot.teacherName}
                              </p>
                              <p className="text-sm text-gray-700 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {slot.time} • {slot.duration} min
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {links.zoomLink ? (
                                <a href={links.zoomLink} target="_blank" rel="noopener">
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Video size={16} /> Zoom
                                  </Button>
                                </a>
                              ) : (
                                <Button size="sm" disabled className="bg-gray-400 text-xs">
                                  Zoom N/A
                                </Button>
                              )}
                              {links.googleClassroomLink ? (
                                <a href={links.googleClassroomLink} target="_blank" rel="noopener">
                                  <Button size="sm" variant="outline">Classroom</Button>
                                </a>
                              ) : (
                                <Button size="sm" disabled variant="outline" className="text-xs">
                                  Classroom N/A
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Class Links Tab */}
        {activeTab === "classlinks" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
              <ExternalLink className="w-6 h-6" />
              My Class Links
            </h2>
            {student.subjects.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">No subjects enrolled.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {student.subjects.map((subject) => {
                  const links = teacherLinks[subject] || {};
                  return (
                    <Card key={subject} className="shadow-md hover:shadow-lg transition">
                      <CardContent className="p-5">
                        <h3 className="font-bold text-indigo-800 mb-3">{subject}</h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {links.zoomLink ? (
                            <a href={links.zoomLink} target="_blank" rel="noopener">
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                <Video size={16} className="mr-1" /> Join Zoom
                              </Button>
                            </a>
                          ) : (
                            <Button disabled className="bg-gray-400">
                              Zoom Not Available
                            </Button>
                          )}
                          {links.googleClassroomLink ? (
                            <a href={links.googleClassroomLink} target="_blank" rel="noopener">
                              <Button variant="outline">Open Classroom</Button>
                            </a>
                          ) : (
                            <Button disabled variant="outline">
                              Classroom Not Available
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;