"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TeacherRecord {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  applicationStage?: string;
  createdAt?: any;
  reviewedAt?: any;
  approvedAt?: any;
}

const TeacherApprovalStatus: React.FC = () => {
  const { currentUser } = useAuth();
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.uid) return;

    // 🔹 Listen to pendingTeachers
    const unsub = onSnapshot(doc(db, "pendingTeachers", currentUser.uid), (snap) => {
      if (snap.exists()) {
        setTeacher({ uid: snap.id, ...snap.data() } as TeacherRecord);
      } else {
        // If not pending, check in teachers
        onSnapshot(doc(db, "teachers", currentUser.uid), (snap2) => {
          if (snap2.exists()) {
            setTeacher({ uid: snap2.id, ...snap2.data() } as TeacherRecord);
          } else {
            setTeacher(null);
          }
        });
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        No application record found.
      </div>
    );
  }

  const steps = [
    {
      label: "Application Submitted",
      active: true,
      date: teacher.createdAt?.toDate?.().toLocaleString() || "—",
    },
    {
      label: "Pending Review",
      active: teacher.applicationStage === "applied" || teacher.applicationStage === "pending",
      date: teacher.applicationStage === "applied" ? "Awaiting principal review" : "—",
    },
    {
      label: "Approved",
      active: teacher.applicationStage === "approved",
      date: teacher.approvedAt ? new Date(teacher.approvedAt).toLocaleString() : "—",
    },
    {
      label: "Rejected",
      active: teacher.applicationStage === "rejected",
      date: teacher.reviewedAt ? new Date(teacher.reviewedAt).toLocaleString() : "—",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            Teacher Application Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-6 text-gray-600">
            {teacher.firstName} {teacher.lastName} ({teacher.email})
          </p>

          <ol className="relative border-l border-gray-300 ml-4">
            {steps.map((step, idx) => (
              <li key={idx} className="mb-8 ml-6">
                <span
                  className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full 
                  ${step.active
                      ? step.label === "Rejected"
                        ? "bg-red-500 text-white"
                        : step.label === "Approved"
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-600"}`}
                >
                  ✓
                </span>
                <h3 className="font-medium leading-tight">{step.label}</h3>
                <p className="text-sm text-gray-500">{step.date}</p>
              </li>
            ))}
          </ol>

          {/* ✅ Conditional Messages */}
          {teacher.applicationStage === "approved" && (
            <div className="mt-4 p-3 text-green-700 bg-green-100 rounded-md text-center">
              🎉 Congratulations! Your application has been approved.
              <div className="mt-4">
                <Button onClick={() => navigate("/teacher-dashboard")} className="bg-blue-600 hover:bg-blue-700">
                  Proceed to Dashboard
                </Button>
              </div>
            </div>
          )}
          {teacher.applicationStage === "rejected" && (
            <div className="mt-4 p-3 text-red-700 bg-red-100 rounded-md text-center">
              ❌ Unfortunately, your application was not approved. Please contact the school for further details.
            </div>
          )}
          {teacher.applicationStage === "applied" && (
            <div className="mt-4 p-3 text-yellow-700 bg-yellow-100 rounded-md text-center">
              ⏳ Your application is under review. Please check back later.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApprovalStatus;
