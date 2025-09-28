"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ProgressTracker from "@/components/auth/ProgressTracker";

const TeacherApprovalStatus: React.FC = () => {
  const [stage, setStage] = useState<string>("applied");
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const unsub = onSnapshot(doc(db, "pendingTeachers", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStage(data.applicationStage || "applied");
      }
    });

    return () => unsub();
  }, [auth.currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressTracker stage={stage} />
          <div className="mt-6">
            {stage === "approved" && (
              <p className="text-green-600 font-semibold">
                🎉 Congratulations! Your application has been approved.
              </p>
            )}
            {stage === "rejected" && (
              <p className="text-red-600 font-semibold">
                ❌ Unfortunately, your application was not successful.
              </p>
            )}
            {stage !== "approved" && stage !== "rejected" && (
              <p className="text-gray-600">
                Please wait while the principal reviews your documents.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApprovalStatus;
