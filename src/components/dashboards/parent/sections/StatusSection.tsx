"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, X, CheckCircle, XCircle, Clock } from "lucide-react";

interface Registration {
  id: string;
  learnerData: {
    firstName: string;
    lastName: string;
    grade: string;
  };
  status:
    | "pending"
    | "payment_pending"
    | "payment_failed"
    | "awaiting_approval"
    | "approved"
    | "rejected"
    | "enrolled";
  paymentReceived: boolean;
}

export default function StatusSection() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const q = query(
        collection(db, "registrations"),
        where("parentId", "==", user.uid)
      );
      const snap = await getDocs(q);

      const list: Registration[] = snap.docs.map((doc) => ({
        id: doc.id,
        learnerData: doc.data().learnerData || {
          firstName: "",
          lastName: "",
          grade: "",
        },
        status: (doc.data().status as Registration["status"]) || "pending",
        paymentReceived: doc.data().paymentReceived || false,
      }));
      setRegistrations(list);
    };

    fetchData();
  }, [user]);

  // Badge colors
  const getStatusColor = (status: Registration["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "payment_pending":
        return "bg-orange-100 text-orange-800";
      case "payment_failed":
        return "bg-red-100 text-red-800";
      case "awaiting_approval":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-200 text-red-900";
      case "enrolled":
        return "bg-green-200 text-green-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Action button logic
  const getActionButton = (reg: Registration) => {
    if (!reg.paymentReceived && reg.status !== "enrolled") {
      return (
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
          <Link to={`/payments?regId=${reg.id}`}>Proceed to Payment</Link>
        </Button>
      );
    }

    switch (reg.status) {
      case "awaiting_approval":
        return (
          <Button size="sm" disabled className="bg-blue-400 text-white">
            Awaiting Principal Approval
          </Button>
        );
      case "approved":
        return (
          <Button size="sm" disabled className="bg-green-500 text-white">
            Approved – Enrollment Processing
          </Button>
        );
      case "rejected":
        return (
          <Button size="sm" disabled className="bg-red-500 text-white">
            Application Rejected
          </Button>
        );
      case "enrolled":
        return (
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Link to={`/registration/${reg.id}`}>View Enrollment</Link>
          </Button>
        );
      default:
        return null;
    }
  };

  // Timeline steps
  const renderTimeline = (reg: Registration) => {
    const steps = [
      {
        key: "registration",
        label: "Registration Submitted",
        active: true,
        done: true,
      },
      {
        key: "payment",
        label: "Payment Completed",
        active: reg.paymentReceived,
        done: reg.paymentReceived,
      },
      {
        key: "approval",
        label: "Principal Approval",
        active: reg.status === "approved" || reg.status === "awaiting_approval",
        done: reg.status === "approved" || reg.status === "enrolled",
        rejected: reg.status === "rejected",
      },
      {
        key: "enrolled",
        label: "Enrolled",
        active: reg.status === "enrolled",
        done: reg.status === "enrolled",
      },
    ];

    return (
      <div className="mt-3">
        <ol className="flex flex-col gap-2 text-sm">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {step.rejected ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : step.done ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : step.active ? (
                <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-gray-400"></div>
              )}
              <span
                className={
                  step.rejected
                    ? "text-red-600 font-medium"
                    : step.done
                    ? "text-green-700"
                    : step.active
                    ? "text-yellow-700"
                    : "text-gray-500"
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div>
      {/* Top bar with navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <button
          onClick={() => navigate("/parent-dashboard")}
          className="text-gray-600 hover:text-red-600"
        >
          <X size={20} />
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">
        Overview of your registrations:
      </h2>

      {registrations.length === 0 ? (
        <p className="text-gray-600">No registrations found.</p>
      ) : (
        <div className="space-y-6">
          {registrations.map((reg) => (
            <Card
              key={reg.id}
              className="p-4 border rounded-lg shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {reg.learnerData.firstName} {reg.learnerData.lastName} –{" "}
                    Grade {reg.learnerData.grade}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                      reg.status
                    )}`}
                  >
                    {!reg.paymentReceived
                      ? "Payment Not Made"
                      : reg.status === "awaiting_approval"
                      ? "Awaiting Principal Approval"
                      : reg.status === "approved"
                      ? "Approved by Principal"
                      : reg.status === "rejected"
                      ? "Rejected"
                      : reg.status === "enrolled"
                      ? "Enrolled"
                      : "Pending"}
                  </span>
                </div>

                <div>{getActionButton(reg)}</div>
              </div>

              {/* 🔹 Timeline view */}
              {renderTimeline(reg)}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
