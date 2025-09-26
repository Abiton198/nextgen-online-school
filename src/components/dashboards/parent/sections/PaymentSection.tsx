import { redirectToPayfast } from "@/lib/payfast";

export default function PaymentsSection() {
  const handleRetry = () => {
    redirectToPayfast({
      amount: 500, // example: tuition fee
      itemName: "Tuition Fees",
      returnUrl: `${window.location.origin}/payment-success`,
      cancelUrl: `${window.location.origin}/payment-cancel`,
      notifyUrl: `${window.location.origin}/api/payfast-notify`,
    });
  };

  return (
    <div>
      <p>Here you can see your payment history and retry pending payments.</p>

      <ul className="mt-4 space-y-2">
        <li className="flex justify-between">
          Registration Fee – ✅ Paid
        </li>
        <li className="flex justify-between">
          Tuition Fees – ❌ Pending
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={handleRetry}
          >
            Retry
          </button>
        </li>
      </ul>
    </div>
  );
}
