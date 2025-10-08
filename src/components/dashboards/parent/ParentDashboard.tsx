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
import TimetableManager from "@/lib/TimetableManager";

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

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: () => void;

    const fetchParentAndStudents = async () => {
      try {
        // fetch parent doc once
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (!parentDoc.exists()) {
          navigate("/register");
          return;
        }

        const data = parentDoc.data();
        setParentName(data.parentName || "");
        setTitle(data.title || "");

        // 👶 set up real-time listener for students
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
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/signin");
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

      <TimetableManager />
    </div>
  );
}
