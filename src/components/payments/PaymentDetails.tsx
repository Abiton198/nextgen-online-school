import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Registration {
  childName: string;
  grade: string;
  purpose: string;
  status: string;
  paymentReceived?: boolean;
  paidAmount?: string;
}

const PaymentDetails: React.FC = () => {
  const { regId } = useParams<{ regId: string }>();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!regId) return;
        const ref = doc(db, "registrations", regId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Registration not found");
          return;
        }
        setRegistration(snap.data() as Registration);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch registration");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [regId]);

 const handleRetry = async () => {
  if (!regId) return;
  setRetrying(true);
  try {
    const res = await fetch("/.netlify/functions/payfast-initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regId }),  // 👈 Only send the existing doc ID
    });
    if (!res.ok) throw new Error("Failed to initiate PayFast");
    const { url } = await res.json();
    window.location.href = url;
  } catch (err) {
    console.error("Retry error:", err);
    alert("Error retrying payment. Please try again.");
  } finally {
    setRetrying(false);
  }
};


  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Learner:</strong> {registration?.childName}</p>
          <p><strong>Grade:</strong> {registration?.grade}</p>
          <p><strong>Purpose:</strong> {registration?.purpose}</p>
          <p>
            <strong>Status:</strong>{" "}
            {registration?.paymentReceived ? (
              <span className="text-green-600">Paid</span>
            ) : (
              <span className="text-red-600">Not Paid</span>
            )}
          </p>
          {registration?.paidAmount && (
            <p><strong>Amount Paid:</strong> R{registration.paidAmount}</p>
          )}

          {/* Retry button */}
          {registration?.status === "payment_failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {retrying ? "Redirecting..." : "Retry Payment"}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDetails;
