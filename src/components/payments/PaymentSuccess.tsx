import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const updatePayment = async () => {
      const regId = searchParams.get("regId");
      if (!regId) {
        setStatus("⚠️ No registration ID found.");
        return;
      }
      try {
        const ref = doc(db, "registrations", regId);
        await updateDoc(ref, { paymentReceived: true });
        setStatus("✅ Payment received! Your child’s enrolment is pending approval.");
      } catch (error) {
        console.error(error);
        setStatus("❌ Error updating payment status. Please contact support.");
      }
    };
    updatePayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <CardTitle>Payment Success</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{status}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
