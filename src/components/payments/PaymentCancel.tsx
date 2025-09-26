import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader>
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-red-700">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Your payment was cancelled. No charges have been made.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You can retry the payment from your Parent Dashboard.
          </p>
          <Button
            onClick={() => navigate("/parent-dashboard")}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
