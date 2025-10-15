"use client";

import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  grade: string;
  status?: string;
}

export default function RegistrationSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [docs, setDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 🔎 Real-time fetch students + parent docs
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: () => void;

    const fetchData = async () => {
      try {
        // parent compliance docs (not real-time, just once)
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        if (parentDoc.exists()) {
          const pdata = parentDoc.data();
          setDocs(pdata.complianceDocs || []);
        }

        // students listener (real-time)
        const q = query(collection(db, "students"), where("parentId", "==", user.uid));
        unsubscribe = onSnapshot(q, (snap) => {
          const list: Student[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Student),
          }));
          setStudents(list);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error fetching registration:", err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // 📂 Upload new documents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.uid || !e.target.files) return;
    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of Array.from(e.target.files)) {
        const storageRef = ref(storage, `parents/${user.uid}/documents/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newUrls.push(url);
      }

      const updatedDocs = [...docs, ...newUrls];
      await updateDoc(doc(db, "parents", user.uid), { complianceDocs: updatedDocs });
      setDocs(updatedDocs);
    } catch (err) {
      console.error("Error uploading docs:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑 Delete a document
  const handleDeleteDoc = async (url: string) => {
    if (!user?.uid) return;
    try {
      const pathStart = url.indexOf("/o/") + 3;
      const pathEnd = url.indexOf("?");
      const fullPath = decodeURIComponent(url.substring(pathStart, pathEnd));

      const storageRef = ref(storage, fullPath);
      await deleteObject(storageRef);

      const updatedDocs = docs.filter((d) => d !== url);
      await updateDoc(doc(db, "parents", user.uid), { complianceDocs: updatedDocs });
      setDocs(updatedDocs);
    } catch (err) {
      console.error("Error deleting doc:", err);
      alert("Delete failed.");
    }
  };

  // ➕ Add or ✏️ Update learner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      if (editingId) {
        await setDoc(
          doc(db, "students", editingId),
          { firstName, lastName, grade, updatedAt: serverTimestamp() },
          { merge: true }
        );
     } else {
  // generate a predictable unique student ID
  const studentId = `student-${Date.now()}`;

  await setDoc(doc(db, "students", studentId), {
    parentId: user.uid,
    parentEmail: user.email,
    firstName,
    lastName,
    grade,
    status: "pending",
    principalReviewed: false,
    createdAt: serverTimestamp(),
  });
}
      // reset form
      setFirstName("");
      setLastName("");
      setGrade("");
      setEditingId(null);
    } catch (err) {
      console.error("Error saving student:", err);
      alert("Save failed.");
    }
  };

  const handleEdit = (s: Student) => {
    setFirstName(s.firstName);
    setLastName(s.lastName);
    setGrade(s.grade);
    setEditingId(s.id || null);
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4 space-y-6">
      {/* 🔝 Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-2 py-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => navigate("/parent-dashboard")}
          className="text-gray-600 hover:text-red-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* 👶 Students List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Registered Students</h3>
        {students.length === 0 ? (
          <p className="text-gray-600">No students registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex justify-between items-center border p-3 rounded bg-gray-50"
              >
                <span>
                  {s.firstName} {s.lastName} – Grade {s.grade}{" "}
                  <span className="italic text-sm text-gray-600">
                    ({s.status || "pending"})
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(s)}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

{/* Form to add student */}
     <div className="border rounded-lg p-4 bg-white shadow">
      {/* Header Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold">
          {editingId ? "Edit Student" : "Register New Student"}
        </h3>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "− Close Form" : "+ Open Form"}
        </Button>
      </div>

      {/* Collapsible Form */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingId ? "Update Student" : "Register Student"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFirstName("");
                      setLastName("");
                      setGrade("");
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* 📂 Compliance Documents */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Compliance Documents</h3>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((url, i) => {
              const isImage = url.match(/\.(jpg|jpeg|png|gif)$/i);
              return (
                <li
                  key={i}
                  className="p-2 border rounded bg-gray-50 flex flex-col items-center relative"
                >
                  {isImage ? (
                    <img
                      src={url}
                      alt={`Document ${i + 1}`}
                      className="max-h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-600 text-sm">📄 Document {i + 1}</div>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm mt-1 hover:underline"
                  >
                    View / Download
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(url)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Upload New */}
        <div className="mt-4">
          <label className="block font-semibold mb-2">Upload New Documents</label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full border p-2 rounded"
          />
          {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
        </div>
      </div>
    </div>
  );
}
