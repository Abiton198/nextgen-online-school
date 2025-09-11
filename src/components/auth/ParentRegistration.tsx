import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, GraduationCap } from 'lucide-react';

interface ParentRegistrationProps {
  onBack: () => void;
}

export const ParentRegistration: React.FC<ParentRegistrationProps> = ({ onBack }) => {
  // Parent form state
  const [parentData, setParentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    occupation: ''
  });

  // Learner form state  
  const [learnerData, setLearnerData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    dateOfBirth: '',
    grade: '',
    previousSchool: '',
    medicalInfo: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Handle parent data changes
  const handleParentChange = (field: string, value: string) => {
    setParentData(prev => ({ ...prev, [field]: value }));
  };

  // Handle learner data changes
  const handleLearnerChange = (field: string, value: string) => {
    setLearnerData(prev => ({ ...prev, [field]: value }));
  };

  // Submit registration for admin approval
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create registration request object
      const registrationRequest = {
        id: `reg_${Date.now()}`,
        parentData,
        learnerData,
        status: 'pending', // pending, approved, rejected
        submittedAt: new Date().toISOString(),
        submittedBy: parentData.email
      };

      // In a real app, this would save to Firebase/database
      // For demo, we'll store in localStorage and show success
      const existingRequests = JSON.parse(localStorage.getItem('registrationRequests') || '[]');
      existingRequests.push(registrationRequest);
      localStorage.setItem('registrationRequests', JSON.stringify(existingRequests));

      setSubmitMessage('Registration submitted successfully! You will receive an email once your application is reviewed by our admin team. This usually takes 1-2 business days.');
      
      // Reset forms after successful submission
      setTimeout(() => {
        setParentData({
          firstName: '', lastName: '', email: '', phone: '', idNumber: '', address: '', occupation: ''
        });
        setLearnerData({
          firstName: '', lastName: '', idNumber: '', dateOfBirth: '', grade: '', previousSchool: '', medicalInfo: '', emergencyContact: '', emergencyPhone: ''
        });
      }, 2000);

    } catch (error) {
      setSubmitMessage('Registration failed. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
            <div className="flex items-center gap-2 text-blue-600">
              <GraduationCap className="w-6 h-6" />
              <span className="font-semibold">NextGen School</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Parent Registration</CardTitle>
          <CardDescription>
            Register yourself and your child for NextGen Online School. Admin approval required.
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
            {/* Parent Information Section */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentFirstName">First Name *</Label>
                  <Input
                    id="parentFirstName"
                    value={parentData.firstName}
                    onChange={(e) => handleParentChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentLastName">Last Name *</Label>
                  <Input
                    id="parentLastName"
                    value={parentData.lastName}
                    onChange={(e) => handleParentChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentEmail">Email Address *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={parentData.email}
                    onChange={(e) => handleParentChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Phone Number *</Label>
                  <Input
                    id="parentPhone"
                    value={parentData.phone}
                    onChange={(e) => handleParentChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentId">ID Number *</Label>
                  <Input
                    id="parentId"
                    value={parentData.idNumber}
                    onChange={(e) => handleParentChange('idNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={parentData.occupation}
                    onChange={(e) => handleParentChange('occupation', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Home Address *</Label>
                  <Textarea
                    id="address"
                    value={parentData.address}
                    onChange={(e) => handleParentChange('address', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Learner Information Section */}
            <div className="border rounded-lg p-6 bg-green-50">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="learnerFirstName">First Name *</Label>
                  <Input
                    id="learnerFirstName"
                    value={learnerData.firstName}
                    onChange={(e) => handleLearnerChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="learnerLastName">Last Name *</Label>
                  <Input
                    id="learnerLastName"
                    value={learnerData.lastName}
                    onChange={(e) => handleLearnerChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="learnerDob">Date of Birth *</Label>
                  <Input
                    id="learnerDob"
                    type="date"
                    value={learnerData.dateOfBirth}
                    onChange={(e) => handleLearnerChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="learnerId">ID Number</Label>
                  <Input
                    id="learnerId"
                    value={learnerData.idNumber}
                    onChange={(e) => handleLearnerChange('idNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade Applying For *</Label>
                  <Select value={learnerData.grade} onValueChange={(value) => handleLearnerChange('grade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
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
                <div>
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input
                    id="previousSchool"
                    value={learnerData.previousSchool}
                    onChange={(e) => handleLearnerChange('previousSchool', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    value={learnerData.emergencyContact}
                    onChange={(e) => handleLearnerChange('emergencyContact', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    value={learnerData.emergencyPhone}
                    onChange={(e) => handleLearnerChange('emergencyPhone', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="medicalInfo">Medical Information / Allergies</Label>
                  <Textarea
                    id="medicalInfo"
                    value={learnerData.medicalInfo}
                    onChange={(e) => handleLearnerChange('medicalInfo', e.target.value)}
                    placeholder="Any medical conditions, allergies, or special needs we should be aware of..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};