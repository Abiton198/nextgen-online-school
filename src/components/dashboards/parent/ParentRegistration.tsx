"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function ParentRegistration() {
  const { user } = useAuth();

  // Form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [learnerGrade, setLearnerGrade] = useState("");
  const [paymentPurpose, setPaymentPurpose] = useState<
    "registration" | "fees" | "other"
  >("registration");

  // Requirement checklist
  const [requirements, setRequirements] = useState({
    internet: false,
    computer: false,
    camera: false,
    stopOrder: false,
  });
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successRegId, setSuccessRegId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "registrations"), {
        parentId: user.uid,
        parentData: {
          name: parentName,
          email: parentEmail,
        },
        learnerData: {
          firstName: learnerName.split(" ")[0],
          lastName: learnerName.split(" ").slice(1).join(" "),
          grade: learnerGrade,
        },
        purpose: paymentPurpose,
        status: "payment_pending", // start at payment_pending
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      setSuccessRegId(docRef.id);
    } catch (err) {
      console.error("Error saving registration:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Parent & Learner Registration</h2>

      {!successRegId ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Info */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Parent Information</h3>
            <Label>Name</Label>
            <Input
              type="text"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />

            <Label className="mt-3">Email</Label>
            <Input
              type="email"
              required
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </div>

          {/* Learner Info */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Learner Information</h3>
            <Label>Full Name</Label>
            <Input
              type="text"
              required
              value={learnerName}
              onChange={(e) => setLearnerName(e.target.value)}
            />

            <Label className="mt-3">Grade</Label>
            <Input
              type="text"
              required
              value={learnerGrade}
              onChange={(e) => setLearnerGrade(e.target.value)}
            />
          </div>

          {/* Fee Structure */}
          <div className="border rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold mb-2">Fee Structure</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>
                <span className="font-medium">Registration Fee:</span> R500
                (once-off, non-refundable)
              </li>
              <li>
                <span className="font-medium">Tuition Fees:</span> R2000 per term
              </li>
              <li>
                <span className="font-medium">Other Payments:</span> Events,
                donations, or extras as selected
              </li>
            </ul>
          </div>

          {/* Payment Purpose */}
          <div className="border rounded-lg p-6 bg-yellow-50">
            <Label className="font-semibold">Payment Type</Label>
            <Select
              value={paymentPurpose}
              onValueChange={(value) =>
                setPaymentPurpose(value as "registration" | "fees" | "other")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration Fee</SelectItem>
                <SelectItem value="fees">Tuition Fees</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requirements Checklist */}
          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-2">
              Minimum Enrolment Requirements
            </h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requirements.internet}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      internet: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Stable internet connection
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requirements.computer}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      computer: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Computer with at least <strong>Intel Core i5</strong>,{" "}
                <strong>4GB RAM</strong>, <strong>240GB SSD</strong>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requirements.camera}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      camera: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Working camera for online classes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requirements.stopOrder}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      stopOrder: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Ability to set up a monthly stop-order for tuition fees
              </label>
            </div>
          </div>

          {/* Declaration */}
          <div className="border rounded-lg p-6 bg-red-50">
            <Label className="font-semibold">Declaration</Label>
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4"
              />
              I confirm that I meet all the above requirements and agree to the
              school’s enrolment policies and fee obligations.
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              loading ||
              !requirements.internet ||
              !requirements.computer ||
              !requirements.camera ||
              !requirements.stopOrder ||
              !declarationAccepted
            }
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      ) : (
        <div className="p-6 bg-green-50 border rounded-lg">
          <h3 className="text-lg font-semibold">Registration Submitted!</h3>
          <p className="mt-2 text-sm text-gray-700">
            Your registration ID is: <strong>{successRegId}</strong>. <br />
            Next, please complete your payment.
          </p>
          <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
            <a href={`/payments/${successRegId}`}>Go to Payment</a>
          </Button>
        </div>
      )}
    </div>
  );
}
