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
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import TimetableCard from "../TimetableCard";

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  grade: string;
  applicationStatus?: string;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Registration");

  const [parentName, setParentName] = useState("");
  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Track which child is selected
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: () => void;

    const fetchParentAndStudents = async () => {
      try {
        // ✅ fetch parent doc
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.name || data.parentName || "");
          setTitle(data.title || "");
        }

        // 👶 set up real-time listener for children
        const q = query(
          collection(db, "students"),
          where("parentId", "==", user.uid)
        );
        unsubscribe = onSnapshot(q, (snap) => {
          const list: Student[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Student),
          }));
          setStudents(list);

          // ✅ auto-select the first child if none selected
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

    // cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, selectedChildId]);

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

  // find the selected child object
  const selectedChild = students.find((c) => c.id === selectedChildId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {title && `${title} `}{parentName}
          </h1>

          {/* Show all children */}
          {students.length > 0 && (
            <div className="mt-2 text-gray-700">
              <p className="font-semibold">Children:</p>
              <ul className="list-disc list-inside">
                {students.map((s) => (
                  <li key={s.id}>
                    {s.firstName} {s.lastName} – Grade {s.grade}{" "}
                    <span className="italic text-sm text-gray-600">
                      ({s.applicationStatus || "pending"})
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

      {/* ✅ Child Selector */}
      {students.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Select Child:</h2>
          <div className="flex gap-2">
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

      {/* ✅ Show timetable only for the selected child */}
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
