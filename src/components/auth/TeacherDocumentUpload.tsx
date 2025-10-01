"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const TeacherDocumentUpload: React.FC = () => {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [qualificationFile, setQualificationFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cetaFile, setCetaFile] = useState<File | null>(null);
  const [workPermitFile, setWorkPermitFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  // 🔹 Check where teacher record lives
  const [targetCollection, setTargetCollection] = useState<"pendingTeachers" | "teachers">("pendingTeachers");

  useEffect(() => {
    const checkCollection = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const teacherDoc = await getDoc(doc(db, "teachers", uid));
      if (teacherDoc.exists()) {
        setTargetCollection("teachers"); // approved
      } else {
        setTargetCollection("pendingTeachers"); // still pending
      }
    };

    checkCollection();
  }, [auth.currentUser]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    const uid = auth.currentUser.uid;

    try {
      const uploads: Record<string, string> = {};

      // helper function for uploading & getting download URL
      const uploadDoc = async (file: File, name: string) => {
        const storageRef = ref(storage, `teachers/${uid}/${name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      };

      if (idFile) uploads.idUrl = await uploadDoc(idFile, "id.pdf");
      if (qualificationFile)
        uploads.qualUrl = await uploadDoc(qualificationFile, "qualification.pdf");
      if (photoFile) uploads.photoUrl = await uploadDoc(photoFile, "photo.jpg");
      if (cetaFile) uploads.cetaUrl = await uploadDoc(cetaFile, "ceta.pdf");
      if (workPermitFile)
        uploads.workPermitUrl = await uploadDoc(workPermitFile, "work_permit.pdf");

      // 🔹 Update Firestore with uploaded docs
      await updateDoc(doc(db, targetCollection, uid), {
        ...uploads,
        updatedAt: serverTimestamp(),
        applicationStage: "documents-submitted",
      });

      // Redirect back to status page
      navigate("/teacher-status");
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert("❌ Upload failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        ⏳ Uploading your documents, please wait...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>ID Document</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Qualifications</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setQualificationFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Profile Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>CETA Certificate</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setCetaFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Work Permit (if non–South African)</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setWorkPermitFile(e.target.files?.[0] || null)} />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              Submit & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDocumentUpload;
