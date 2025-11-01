"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import RegistrationSection from "./sections/RegistrationSection";
import PaymentsSection from "./sections/PaymentSection";
import SettingsSection from "./sections/SettingsSection";
import CommunicationsSection from "./sections/CommunicationsSection";
import StatusSection from "./sections/StatusSection";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth, db } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ---------------- Helper: Normalize Grade ---------------- */
const normalizeGrade = (grade?: string): string => {
  if (!grade) return "";
  return grade.replace(/^grade\s*/i, "").trim().toLowerCase();
};

/* ---------------- Types ---------------- */
interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  grade: string;
  subjects?: string[]; // Selected subjects
  status?: string;
  parentId?: string;
}

interface TimetableEntry {
  id: string;
  date: string;
  time: string;
  subject: string;
  teacherName: string;
  duration: number;
  grade: string;
}

/* ---------------- Sections ---------------- */
const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Registration");
  const [parentName, setParentName] = useState("");
  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showRegisterCard, setShowRegisterCard] = useState(false);

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    grade: "",
    gender: "",
    email: "",
  });

  const navigate = useNavigate();

  /* ---------------- Real-Time Data Fetch ---------------- */
  useEffect(() => {
    if (!user?.uid) return;

    let unsubStudents: () => void;
    let unsubTimetable: () => void;

    const fetchData = async () => {
      try {
        // Parent name
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.name || data.parentName || "");
          setTitle(data.title || "");
        }

        // Students (real-time)
        const studentQuery = query(
          collection(db, "students"),
          where("parentId", "==", user.uid)
        );
        unsubStudents = onSnapshot(studentQuery, (snap) => {
          const list: Student[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Student),
          }));
          setStudents(list);
          if (list.length > 0 && !selectedChildId) {
            setSelectedChildId(list[0].id!);
          }
        });

        // Timetable (real-time)
        const timetableQuery = query(collection(db, "timetable"));
        unsubTimetable = onSnapshot(timetableQuery, (snap) => {
          const entries: TimetableEntry[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setTimetable(entries);
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubStudents?.();
      unsubTimetable?.();
    };
  }, [user?.uid]);

  /* ---------------- Input Handlers ---------------- */
  const handleFieldChange = (field: string, value: string) => {
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterStudent = async () => {
    const { firstName, lastName, grade, email } = newStudent;
    if (!firstName || !lastName || !grade || !email) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const studentRef = await addDoc(collection(db, "students"), {
        firstName,
        lastName,
        grade,
        email,
        uid: "",
        parentId: user?.uid,
        linkedParentEmail: user?.email,
        status: "pending",
        approvedByPrincipal: false,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "parents", user?.uid), {
        updatedAt: serverTimestamp(),
        lastRegisteredChild: studentRef.id,
      });

      alert("Student registered successfully!");
      setNewStudent({ firstName: "", lastName: "", grade: "", gender: "", email: "" });
      setShowRegisterCard(false);
    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "Registration": return <RegistrationSection />;
      case "Payments": return <PaymentsSection />;
      case "Settings": return <SettingsSection />;
      case "Communications": return <CommunicationsSection />;
      case "Status": return <StatusSection />;
      default: return <p>Select a tab.</p>;
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Loading dashboard...</p>;
  }

  const selectedChild = students.find((c) => c.id === selectedChildId);
  const childGradeNorm = normalizeGrade(selectedChild?.grade);
  const childSubjects = selectedChild?.subjects || [];

  // Filter: grade + only selected subjects
  const childTimetable = timetable
    .filter((entry) => {
      const entryGradeNorm = normalizeGrade(entry.grade);
      const gradeMatch = entryGradeNorm === childGradeNorm;
      const subjectMatch = childSubjects.includes(entry.subject);
      return gradeMatch && subjectMatch;
    })
    .sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {title && `${title} `}{parentName}
          </h1>

          {students.length > 0 && (
            <div className="mt-2 text-gray-700">
              <p className="font-semibold">Children:</p>
              <ul className="list-disc list-inside">
                {students.map((s) => (
                  <li key={s.id}>
                    {s.firstName} {s.lastName} – Grade {s.grade}{" "}
                    <span className={`italic text-sm ${s.status === "enrolled" ? "text-green-600" : "text-gray-600"}`}>
                      ({s.status || "pending"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Register New Student */}
      <Card className="border">
        <CardHeader
          onClick={() => setShowRegisterCard(!showRegisterCard)}
          className="flex justify-between items-center cursor-pointer"
        >
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Register New Student
            {showRegisterCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        {showRegisterCard && (
          <CardContent className="space-y-3">
            <Input placeholder="First Name" value={newStudent.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} />
            <Input placeholder="Last Name" value={newStudent.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} />
            <Input placeholder="Grade (e.g. Grade 8)" value={newStudent.grade} onChange={(e) => handleFieldChange("grade", e.target.value)} />
            <Input placeholder="Email" value={newStudent.email} onChange={(e) => handleFieldChange("email", e.target.value)} />
            <Button onClick={handleRegisterStudent} className="w-full">Register Student</Button>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-4 py-2 rounded-t whitespace-nowrap ${
              activeTab === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <Card className="border mt-4">
        <CardHeader>
          <CardTitle>{activeTab} Section</CardTitle>
        </CardHeader>
        <CardContent>{renderSection()}</CardContent>
      </Card>

      {/* Child Selector */}
      {students.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Select Child:</h2>
          <div className="flex gap-2 flex-wrap">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedChildId(s.id!)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedChildId === s.id ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {s.firstName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timetable */}
      {selectedChild && (
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Timetable for {selectedChild.firstName}
              <span className="text-sm font-normal opacity-90">
                ({childSubjects.length > 0 ? childSubjects.join(", ") : "No subjects selected"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gray-50">
            {childTimetable.length > 0 ? (
              <div className="space-y-4">
                {childTimetable.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-900 text-lg">{entry.subject}</h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-700">
                          <p>
                            <span className="font-medium">{entry.teacherName}</span>
                          </p>
                          <p>
                            {entry.time} • {entry.duration} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">
                          {new Date(entry.date).toLocaleDateString("en-ZA", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3	flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 italic">
                  {childSubjects.length === 0
                    ? "No subjects selected for this child."
                    : "No timetable available for selected subjects yet."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {childSubjects.length === 0
                    ? "Update subjects in Registration."
                    : "Only available timetable entries are shown."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}