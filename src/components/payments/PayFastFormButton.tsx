"use client";
import React, { useState } from "react";

const PAYFAST_ENDPOINT = "https://payment.payfast.io/eng/process";

export default function PayFastFormButton() {
  const [amount, setAmount] = useState(1000);
  const [qty, setQty] = useState(1);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget as HTMLFormElement;
    const total = Number(amount) * Number(qty);
    const amountField = form.querySelector<HTMLInputElement>("input[name='amount']");
    if (amountField) amountField.value = total.toFixed(2);
    return true;
  }

  return (
    <form
      onSubmit={handleSubmit}
      name="PayFastPayNowForm"
      action={PAYFAST_ENDPOINT}
      method="post"
      className="border rounded p-4 space-y-4 bg-white"
    >
      {/* required PayFast hidden fields */}
      <input type="hidden" name="cmd" value="_paynow" />
      <input type="hidden" name="receiver" value="27337359" />
      <input type="hidden" name="return_url" value="https://nextgenonlineschool.netlify.app/payment-success" />
      <input type="hidden" name="cancel_url" value="https://nextgenonlineschool.netlify.app/payment-cancel" />
      <input type="hidden" name="notify_url" value="https://nextgenonlineschool.netlify.app/api/payfast-notify" />
      <input
        type="hidden"
        name="item_name"
        value="Nextgen Online Independent School"
      />
      <input
        type="hidden"
        name="item_description"
        value="Make payment for your registration, tuition, donations or any other school event."
      />

      {/* amount */}
      <div>
        <label htmlFor="pf-amount" className="block text-sm mb-1">Amount (R)</label>
        <input
          required
          id="pf-amount"
          name="amount"
          type="number"
          step=".01"
          min="5.00"
          className="border p-2 rounded w-full"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      {/* quantity */}
      <div>
        <label htmlFor="pf-qty" className="block text-sm mb-1">Quantity</label>
        <input
          required
          id="pf-qty"
          name="custom_quantity"
          type="number"
          min="1"
          className="border p-2 rounded w-full"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </div>

      {/* PayFast button image */}
      <div className="flex justify-center">
        <button type="submit" title="Pay Now with PayFast">
          <img
            src="https://my.payfast.io/images/buttons/PayNow/Primary-Large-PayNow.png"
            alt="Pay Now"
          />
        </button>
      </div>
    </form>
  );
}
