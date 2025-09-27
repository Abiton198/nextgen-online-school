import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RegistrationSection from "./sections/RegistrationSection";
import PaymentsSection from "./sections/PaymentSection";
import SettingsSection from "./sections/SettingsSection";
import CommunicationsSection from "./sections/CommunicationsSection";
import StatusSection from "./sections/StatusSection";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>("");
  const [title, setTitle] = useState<string>("Mr/Mrs");
  const [children, setChildren] = useState<{ firstName?: string; grade?: string }[]>([]);

  // Fetch parent record
  useEffect(() => {
    const fetchParent = async () => {
      if (!user?.uid) return;
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
      if (!user?.uid) return;
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

  const renderSection = () => {
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
      {/* 👋 Greeting */}
      <div className="mb-6">
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

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Card
            key={s}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => setActiveSection(s)}
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

      {/* Section Details */}
      <div className="mt-8">
        {activeSection && (
          <Card className="border">
            <CardHeader>
              <CardTitle>{activeSection} Details</CardTitle>
            </CardHeader>
            <CardContent>{renderSection()}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
