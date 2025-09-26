// utils/payfast.ts
export interface PayfastOptions {
  registrationId: string;
  parent: { firstName: string; lastName: string; email: string };
  purpose: "registration" | "fees" | "other";
}

export function redirectToPayfast({ registrationId, parent, purpose }: PayfastOptions) {
  const payfastUrl = "https://www.payfast.co.za/eng/process";

  const amounts: Record<PayfastOptions["purpose"], string> = {
    registration: "500.00",
    fees: "2000.00",
    other: "100.00",
  };

  const itemNames: Record<PayfastOptions["purpose"], string> = {
    registration: "Registration Fee",
    fees: "Tuition Fees",
    other: "Other Payment",
  };

  const params = new URLSearchParams({
    merchant_id: "YOUR_MERCHANT_ID",
    merchant_key: "YOUR_MERCHANT_KEY",
    return_url: `${window.location.origin}/payment-success?regId=${registrationId}`,
    cancel_url: `${window.location.origin}/payment-cancel`,
    notify_url: `${window.location.origin}/api/payfast-notify`,
    name_first: parent.firstName,
    name_last: parent.lastName,
    email_address: parent.email,
    m_payment_id: registrationId,
    amount: amounts[purpose],
    item_name: itemNames[purpose],
  });

  window.location.href = `${payfastUrl}?${params.toString()}`;
}
