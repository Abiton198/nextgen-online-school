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
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react"; // 🔹 icons

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Registration"); // default tab
  const [parentName, setParentName] = useState("");
  const [title, setTitle] = useState("Mr/Mrs");
  const [children, setChildren] = useState<{ firstName?: string; grade?: string }[]>([]);
  const navigate = useNavigate();

  // 🔎 Fetch parent & children info
  useEffect(() => {
    if (!user?.uid) return;

    const fetchParent = async () => {
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.firstName || "");
          setTitle(data.title || "Mr/Mrs");
        }
      } catch (err) {
        console.error("Error fetching parent:", err);
      }
    };

    const fetchChildren = async () => {
      try {
        const q = query(collection(db, "registrations"), where("parentId", "==", user.uid));
        const snap = await getDocs(q);
        const kids = snap.docs.map((d) => d.data().learnerData || {});
        setChildren(kids);
      } catch (err) {
        console.error("Error fetching children:", err);
      }
    };

    fetchParent();
    fetchChildren();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  // 🔹 Tab switcher
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {title} {parentName}
          </h1>
          {children.length > 0 && (
            <div className="mt-2 text-gray-700">
              {children.map((c, i) => (
                <p key={i}>
                  Child: {c.firstName || "Unknown"} – Grade {c.grade || "-"}
                </p>
              ))}
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

      {/* Content */}
      <Card className="border mt-4">
        <CardHeader>
          <CardTitle>{activeTab} Section</CardTitle>
        </CardHeader>
        <CardContent>{renderSection()}</CardContent>
      </Card>
    </div>
  );
}
