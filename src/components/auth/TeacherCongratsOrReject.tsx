"use client";

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TeacherCongratsOrReject: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const status = state?.status;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>{status === "approved" ? "🎉 Congratulations!" : "😔 Regret to Inform"}</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "approved" ? (
            <>
              <p className="mb-4">Your teacher application has been approved by the principal. Welcome aboard!</p>
              <Button onClick={() => navigate("/teacher-dashboard")}>Go to Dashboard</Button>
            </>
          ) : (
            <>
              <p className="mb-4">Unfortunately, your teacher application was not successful.</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherCongratsOrReject;
