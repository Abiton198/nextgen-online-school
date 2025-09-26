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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, UserPlus, GraduationCap } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, doc, setDoc } from "firebase/firestore";
import { redirectToPayfast } from "@/utils/payfast";

interface ParentRegistrationProps {
  onBack: () => void;
}

export const ParentRegistration: React.FC<ParentRegistrationProps> = ({
  onBack,
}) => {
  const [parentData, setParentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    occupation: "",
  });

  const [learnerData, setLearnerData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    grade: "",
    previousSchool: "",
    medicalInfo: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const [paymentPurpose, setPaymentPurpose] =
    useState<"registration" | "fees" | "other">("registration");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleParentChange = (field: string, value: string) => {
    setParentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLearnerChange = (field: string, value: string) => {
    setLearnerData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const registrationId = `reg_${Date.now()}`;
      const registrationRequest = {
        id: registrationId,
        parentData,
        learnerData,
        status: "pending",
        paymentReceived: false,
        submittedAt: new Date().toISOString(),
        submittedBy: parentData.email,
      };

      const ref = doc(collection(db, "registrations"), registrationId);
      await setDoc(ref, registrationRequest);

      setSubmitMessage(
        "✅ Registration submitted! Redirecting to PayFast checkout..."
      );

      setTimeout(() => {
        redirectToPayfast({
          registrationId,
          parent: {
            firstName: parentData.firstName,
            lastName: parentData.lastName,
            email: parentData.email,
          },
          purpose: paymentPurpose,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
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
              Back to Login
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
          {submitMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {submitMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Parent Info */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Parent Information
                </h3>
              </div>
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
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Learner Information
                </h3>
              </div>
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

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit & Pay"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
