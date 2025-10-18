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
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, ChevronUp } from "lucide-react";
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
  email?: string;
  uid?: string;
  parentId?: string;
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
    email: "",
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
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------- Register + Link Student ---------------- */
 const handleRegisterStudent = async () => {
  const { firstName, lastName, grade, gender, email } = newStudent;
  if (!firstName || !lastName || !grade || !email) {
    alert("Please fill all required fields (First name, Last name, Grade, Email).");
    return;
  }

  try {
    // 1️⃣ Create new student record linked to parent
    const studentRef = await addDoc(collection(db, "students"), {
      firstName,
      lastName,
      grade,
      gender,
      email,
      uid: "", // placeholder to link later when student logs in
      parentId: user?.uid,
      linkedParentEmail: user?.email,
      status: "pending",
      approvedByPrincipal: false,
      createdAt: serverTimestamp(),
    });

    // 2️⃣ Link this new student in parent's record
    await updateDoc(doc(db, "parents", user?.uid), {
      updatedAt: serverTimestamp(),
      lastRegisteredChild: studentRef.id,
    });

    alert("Student registered and linked successfully!");
    setNewStudent({ firstName: "", lastName: "", grade: "", gender: "", email: "" });
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
                        s.status === "enrolled" ? "text-green-600" : "text-gray-600"
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

      {/* ✅ Collapsible Register Student Card */}
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
          <CardContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="First Name"
                value={newStudent.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
              />
              <Input
                placeholder="Last Name"
                value={newStudent.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
              />
              <Input
                placeholder="Email (student login)"
                value={newStudent.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
              <Select onValueChange={(v) => handleFieldChange("grade", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => handleFieldChange("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handleRegisterStudent}>
              Register & Link Student
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
                  selectedChildId === s.id ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
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
