import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

interface ParentRegistrationProps {
  onBack: () => void;
}

export const ParentRegistration: React.FC<ParentRegistrationProps> = ({ onBack }) => {
  const { user } = useAuth();

  // Local state for form fields
  const [parentData, setParentData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
  });

  const [learnerData, setLearnerData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    grade: "",
  });

  const [paymentPurpose, setPaymentPurpose] =
    useState<"registration" | "fees" | "other">("registration");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Handlers for form inputs
  const handleParentChange = (field: string, value: string) => {
    setParentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLearnerChange = (field: string, value: string) => {
    setLearnerData((prev) => ({ ...prev, [field]: value }));
  };

  // Save registration to Firestore with UID as the document ID
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) throw new Error("User not authenticated");

      const regId = user.uid; // use UID as registrationId

      await setDoc(doc(db, "registrations", regId), {
        parentId: user.uid,
        submittedBy: user.email,
        parentData,
        learnerData,
        status: "pending",
        paymentReceived: false,
        createdAt: serverTimestamp(),
      });

      setRegistrationId(regId);
      setSubmitMessage("✅ Registration saved! Please proceed with payment below.");
    } catch (error) {
      console.error("Error saving registration:", error);
      setSubmitMessage("❌ Registration failed. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-blue-600">
              <GraduationCap className="w-6 h-6" />
              <span className="font-semibold">NextGen School</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Parent Registration
          </CardTitle>
          <CardDescription>
            Register your child. Enrolment requires admin approval + payment.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Show success/error messages */}
          {submitMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {submitMessage}
              </AlertDescription>
            </Alert>
          )}

          {!registrationId ? (
            // ---------------- Registration Form ----------------
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Parent Info */}
              <div className="border rounded-lg p-6 bg-blue-50">
                <h3 className="text-lg font-semibold mb-4">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name *"
                    value={parentData.firstName}
                    onChange={(e) =>
                      handleParentChange("firstName", e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Last Name *"
                    value={parentData.lastName}
                    onChange={(e) =>
                      handleParentChange("lastName", e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={parentData.email}
                    onChange={(e) => handleParentChange("email", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Phone *"
                    value={parentData.phone}
                    onChange={(e) => handleParentChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Learner Info */}
              <div className="border rounded-lg p-6 bg-green-50">
                <h3 className="text-lg font-semibold mb-4">Learner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name *"
                    value={learnerData.firstName}
                    onChange={(e) =>
                      handleLearnerChange("firstName", e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Last Name *"
                    value={learnerData.lastName}
                    onChange={(e) =>
                      handleLearnerChange("lastName", e.target.value)
                    }
                    required
                  />
                  <Input
                    type="date"
                    value={learnerData.dateOfBirth}
                    onChange={(e) =>
                      handleLearnerChange("dateOfBirth", e.target.value)
                    }
                    required
                  />
                  <Select
                    value={learnerData.grade}
                    onValueChange={(v) => handleLearnerChange("grade", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Purpose */}
              <div className="border rounded-lg p-6 bg-yellow-50">
                <Label>Payment Type</Label>
                <Select
                  value={paymentPurpose}
                  onValueChange={(value: "registration" | "fees" | "other") =>
                    setPaymentPurpose(value)
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

              {/* Declaration */}
              <div className="border rounded-lg p-6 bg-red-50">
                <Label className="font-semibold">Declaration</Label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" required className="w-4 h-4" />
                  <span>I confirm I meet the minimum enrolment requirements</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Save Registration"}
              </Button>
            </form>
          ) : (
            // ---------------- Payment Form ----------------
            <form action="https://www.payfast.co.za/eng/process" method="POST">
              <input
                type="hidden"
                name="merchant_id"
                value={process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID}
              />
              <input
                type="hidden"
                name="merchant_key"
                value={process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY}
              />
              <input
                type="hidden"
                name="return_url"
                value={`${window.location.origin}/payment-success?regId=${registrationId}`}
              />
              <input
                type="hidden"
                name="cancel_url"
                value={`${window.location.origin}/payment-cancel`}
              />
              <input
                type="hidden"
                name="notify_url"
                value={`${window.location.origin}/api/payfast-notify`}
              />

              <input type="hidden" name="name_first" value={parentData.firstName} />
              <input type="hidden" name="name_last" value={parentData.lastName} />
              <input type="hidden" name="email_address" value={parentData.email} />

              <input type="hidden" name="m_payment_id" value={registrationId} />
              <input
                type="hidden"
                name="amount"
                value={
                  paymentPurpose === "registration"
                    ? "1000.00"
                    : paymentPurpose === "fees"
                    ? "2850.00"
                    : "100.00"
                }
              />
              <input
                type="hidden"
                name="item_name"
                value={
                  paymentPurpose === "registration"
                    ? "Registration Fee"
                    : paymentPurpose === "fees"
                    ? "Tuition Fees"
                    : "Other Payment"
                }
              />

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 mt-4"
              >
                Pay Now with PayFast
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
