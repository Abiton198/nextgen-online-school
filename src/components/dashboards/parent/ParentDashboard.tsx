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
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import TimetableManager from "@/lib/TimetableManager";

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Registration");

  const [parentName, setParentName] = useState("");
  const [title, setTitle] = useState(""); // optional
  const [learner, setLearner] = useState<{ firstName?: string; lastName?: string; grade?: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    const fetchParent = async () => {
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const data = parentDoc.data();

          if (data.applicationStatus !== "submitted") {
            navigate("/register");
            return;
          }

          setParentName(data.parentName || "");
          setTitle(data.title || ""); // optional, may not exist
          setLearner(data.learnerData || null);
        } else {
          navigate("/register");
        }
      } catch (err) {
        console.error("Error fetching parent:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParent();
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
          {learner && (
            <div className="mt-2 text-gray-700">
              <p>
                Child: {learner.firstName || "Unknown"} {learner.lastName || ""} – Grade {learner.grade || "-"}
              </p>
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

      <TimetableManager/>
    </div>
  );
}
