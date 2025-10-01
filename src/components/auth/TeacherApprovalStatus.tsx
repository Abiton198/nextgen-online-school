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
  updatedAt?: any;
}

// 🔹 Safe date formatter
const formatDate = (d: any): string => {
  if (!d) return "—";
  if (typeof d.toDate === "function") return d.toDate().toLocaleString();
  if (typeof d === "string") return new Date(d).toLocaleString();
  return "—";
};

const TeacherApprovalStatus: React.FC = () => {
  const { currentUser } = useAuth();
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Subscribe to both pending + teachers collection
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubPending = onSnapshot(doc(db, "pendingTeachers", currentUser.uid), (snap) => {
      if (snap.exists()) {
        setTeacher({ uid: snap.id, ...snap.data() } as TeacherRecord);
        setLoading(false);
      }
    });

    const unsubApproved = onSnapshot(doc(db, "teachers", currentUser.uid), (snap) => {
      if (snap.exists()) {
        setTeacher({ uid: snap.id, ...snap.data() } as TeacherRecord);
        setLoading(false);
      }
    });

    return () => {
      unsubPending();
      unsubApproved();
    };
  }, [currentUser?.uid]);

  // 🔹 Auto-redirect if awaiting documents
  useEffect(() => {
    if (teacher?.applicationStage === "awaiting-documents") {
      navigate("/upload-teacher-docs");
    }
  }, [teacher, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        ⏳ Loading your application status...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 space-y-4">
        ❌ No application record found. Please submit an application first.
        <Button onClick={() => navigate("/apply-teacher")} className="bg-blue-600 hover:bg-blue-700">
          Apply Now
        </Button>
      </div>
    );
  }

  // 🔹 Define timeline steps
  const stage = teacher.applicationStage;
  const steps = [
    {
      label: "Application Submitted",
      done: true,
      date: formatDate(teacher.createdAt),
    },
    {
      label: "Awaiting Documents",
      done: stage !== "applied" && stage !== "awaiting-documents",
      date: stage === "awaiting-documents" ? "Pending upload" : "—",
    },
    {
      label: "Documents Uploaded",
      done: ["documents-submitted", "under-review", "approved", "rejected"].includes(stage || ""),
      date: ["documents-submitted", "under-review", "approved", "rejected"].includes(stage || "")
        ? formatDate(teacher.updatedAt)
        : "—",
    },
    {
      label: "Under Review",
      done: ["under-review", "approved", "rejected"].includes(stage || ""),
      date:
        stage === "under-review"
          ? teacher.reviewedAt
            ? formatDate(teacher.reviewedAt)
            : "Awaiting principal review"
          : "—",
    },
    {
      label: "Approved",
      done: stage === "approved",
      date: formatDate(teacher.approvedAt),
    },
    {
      label: "Rejected",
      done: stage === "rejected",
      date: formatDate(teacher.reviewedAt),
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

          {/* Timeline */}
          <ol className="relative border-l border-gray-300 ml-4">
            {steps.map((step, idx) => (
              <li key={idx} className="mb-8 ml-6">
                <span
                  className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full 
                  ${
                    step.done
                      ? step.label === "Rejected"
                        ? "bg-red-500 text-white"
                        : step.label === "Approved"
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  ✓
                </span>
                <h3 className="font-medium leading-tight">{step.label}</h3>
                <p className="text-sm text-gray-500">{step.date}</p>
              </li>
            ))}
          </ol>

          {/* ✅ Conditional Messages */}
          {stage === "approved" && (
            <div className="mt-4 p-3 text-green-700 bg-green-100 rounded-md text-center">
              🎉 Congratulations! Your application has been approved.
              <div className="mt-4">
                <Button
                  onClick={() => navigate("/teacher-dashboard")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Dashboard
                </Button>
              </div>
            </div>
          )}
          {stage === "rejected" && (
            <div className="mt-4 p-3 text-red-700 bg-red-100 rounded-md text-center">
              ❌ Unfortunately, your application was not approved. Please contact the school for further details.
            </div>
          )}
          {stage === "under-review" && (
            <div className="mt-4 p-3 text-blue-700 bg-blue-100 rounded-md text-center">
              🔎 Your application is under review by the principal. Please check back later.
            </div>
          )}
          {stage === "documents-submitted" && (
            <div className="mt-4 p-3 text-yellow-700 bg-yellow-100 rounded-md text-center">
              📂 Your documents have been uploaded. Please wait for the principal to review your application.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApprovalStatus;
