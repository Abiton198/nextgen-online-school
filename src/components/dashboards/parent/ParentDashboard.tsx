"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, ChevronUp, Save } from "lucide-react";
import TimetableCard from "../TimetableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ---------------- Sections ---------------- */
const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

/* ---------------- Types ---------------- */
interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  grade: string;
  gender?: string;
  status?: string;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Registration");

  const [parentName, setParentName] = useState("");
  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [showRegisterCard, setShowRegisterCard] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    grade: "",
    gender: "",
  });

  const navigate = useNavigate();

  /* ---------------- Fetch Parent + Children ---------------- */
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: () => void;

    const fetchParentAndStudents = async () => {
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.name || data.parentName || "");
          setTitle(data.title || "");
        }

        const q = query(collection(db, "students"), where("parentId", "==", user.uid));
        unsubscribe = onSnapshot(q, (snap) => {
          const list: Student[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Student),
          }));
          setStudents(list);

          if (list.length > 0 && !selectedChildId) {
            setSelectedChildId(list[0].id!);
          }
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParentAndStudents();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, selectedChildId]);

  /* ---------------- Handle Input Changes ---------------- */
  const handleFieldChange = (field: string, value: string) => {
    // ✅ only updates local form state, no Firestore writes
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------- Save Student ---------------- */
  const handleRegisterStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.grade) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "students"), {
        ...newStudent,
        parentId: user?.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Student registered successfully!");
      setNewStudent({ firstName: "", lastName: "", grade: "", gender: "" });
      setShowRegisterCard(false);
    } catch (err) {
      console.error("Error registering new student:", err);
      alert("Registration failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "Registration":
        return <RegistrationSection />;
      case "Payments":
        return <PaymentsSection />;
      case "Settings":
        return <SettingsSection />;
      case "Communications":
        return <CommunicationsSection />;
      case "Status":
        return <StatusSection />;
      default:
        return <p>Select a tab above.</p>;
    }
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  const selectedChild = students.find((c) => c.id === selectedChildId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {title && `${title} `}{parentName}
          </h1>

          {/* Children List */}
          {students.length > 0 && (
            <div className="mt-2 text-gray-700">
              <p className="font-semibold">Children:</p>
              <ul className="list-disc list-inside">
                {students.map((s) => (
                  <li key={s.id}>
                    {s.firstName} {s.lastName} – Grade {s.grade}{" "}
                    <span
                      className={`italic text-sm ${
                        s.status === "enrolled"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
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

      {/* ✅ Single Collapsible Register Student Card */}
      <Card className="border">
        <CardHeader
          onClick={() => setShowRegisterCard(!showRegisterCard)}
          className="flex justify-between items-center cursor-pointer"
        >
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Register New Student
            {showRegisterCard ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </CardTitle>
        </CardHeader>

        {showRegisterCard && (
          <CardContent className="space-y-4 mt-2">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <Input
                value={newStudent.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <Input
                value={newStudent.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                placeholder="Enter last name"
              />
            </div>

            {/* Grade Dropdown */}
            <div>
              <label className="block text-sm font-medium">Grade</label>
              <Select
                onValueChange={(val) => handleFieldChange("grade", val)}
                value={newStudent.grade}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={`${i + 1}`}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium">Gender</label>
              <Select
                onValueChange={(val) => handleFieldChange("gender", val)}
                value={newStudent.gender}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRegisterStudent}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Student
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex space-x-4 border-b pb-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-4 py-2 rounded-t ${
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
                className={`px-3 py-1 rounded ${
                  selectedChildId === s.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {s.firstName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timetable for selected child */}
      {selectedChild && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Timetable for {selectedChild.firstName} (Grade {selectedChild.grade})
          </h3>
          <TimetableCard grade={selectedChild.grade} />
        </div>
      )}
    </div>
  );
}
