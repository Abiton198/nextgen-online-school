// src/components/auth/PendingApprovalScreen.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

const PendingApprovalScreen: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            ⏳ Approval Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your account has been created, but it’s waiting for approval by the principal.  
            You’ll be able to log in once your account is approved.
          </p>
          <Button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white">
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalScreen;
