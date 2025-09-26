import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RegistrationSection from "./sections/RegistrationSection";
import PaymentsSection from "./sections/PaymentSection";
import SettingsSection from "./sections/SettingsSection";
import CommunicationsSection from "./sections/CommunicationsSection";
import StatusSection from "./sections/StatusSection";

const sections = ["Registration", "Payments", "Settings", "Communications", "Status"];

export default function ParentDashboard() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
      <h1 className="text-2xl font-bold">Parent Dashboard</h1>

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
