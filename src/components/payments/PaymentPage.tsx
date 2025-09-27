import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const { regId } = useParams<{ regId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const startPayment = async () => {
      try {
        const resp = await fetch("/.netlify/functions/payfast-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regId }),
        });

        if (!resp.ok) throw new Error("Failed to start PayFast checkout");
        const { url } = await resp.json();

        // 🚀 Redirect to PayFast secure checkout page
        window.location.href = url;
      } catch (err) {
        console.error("Payment error:", err);
        alert("Could not start payment. Please try again.");
        // fallback: send them to the details page instead
        navigate(`/payment-details/${regId}`);
      }
    };

    if (regId) startPayment();
  }, [regId, navigate]);

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold">Redirecting to PayFast…</h2>
      <p className="text-gray-500">Please wait, we are preparing your payment.</p>
    </div>
  );
};

export default PaymentPage;
