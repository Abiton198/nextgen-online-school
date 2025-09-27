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
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react"; // 🔹 icons

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState<number>(-1); // -1 means none selected
  const [parentName, setParentName] = useState<string>("");
  const [title, setTitle] = useState<string>("Mr/Mrs");
  const [children, setChildren] = useState<{ firstName?: string; grade?: string }[]>([]);
  const navigate = useNavigate();

  // Fetch parent + children
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

  // 🔹 Navigation logic
  const goBack = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };
  const goForward = () => {
    if (activeIndex < sections.length - 1) setActiveIndex((prev) => prev + 1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/signin"); // redirect to sign in page
  };

  const renderSection = () => {
    const activeSection = sections[activeIndex];
    switch (activeSection) {
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
        return <p>Select a card above to view details.</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top bar with greeting + logout */}
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

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s, idx) => (
          <Card
            key={s}
            className={`cursor-pointer hover:shadow-lg transition ${
              activeIndex === idx ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveIndex(idx)}
          >
            <CardHeader>
              <CardTitle>{s}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Quick overview about {s.toLowerCase()}…</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Details + nav arrows */}
      {activeIndex >= 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex justify-between">
            <button
              onClick={goBack}
              disabled={activeIndex <= 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              <ArrowLeft size={18} /> Previous
            </button>
            <button
              onClick={goForward}
              disabled={activeIndex >= sections.length - 1}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>

          <Card className="border">
            <CardHeader>
              <CardTitle>{sections[activeIndex]} Details</CardTitle>
            </CardHeader>
            <CardContent>{renderSection()}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
