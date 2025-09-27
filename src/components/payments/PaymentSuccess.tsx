import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Checking payment...");
  const navigate = useNavigate();

  useEffect(() => {
    const checkPayment = async () => {
      const regId = searchParams.get("regId");
      if (!regId) {
        setStatus("⚠️ No registration ID found.");
        return;
      }

      try {
        const ref = doc(db, "registrations", regId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setStatus("❌ Registration not found.");
          return;
        }

        const data = snap.data();
        if (data.paymentReceived) {
          setStatus("✅ Payment received! Your child’s enrolment is pending approval.");
          // optional: auto-redirect to details page
          setTimeout(() => navigate(`/payments/${regId}`), 2000);
        } else {
          setStatus("⌛ Payment pending. Please wait for confirmation.");
        }
      } catch (error) {
        console.error(error);
        setStatus("❌ Error fetching payment status. Please contact support.");
      }
    };

    checkPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{status}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
