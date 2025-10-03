"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import ParentRegistration from "@/components/auth/ParentRegistration";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Trash2 } from "lucide-react";

export default function RegistrationSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [learner, setLearner] = useState<{ firstName?: string; lastName?: string; grade?: string } | null>(null);
  const [status, setStatus] = useState<string>("pending_registration");
  const [docs, setDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // 🔎 Fetch parent registration data
  const fetchRegistration = async () => {
    if (!user?.uid) return;
    try {
      const parentDoc = await getDoc(doc(db, "parents", user.uid));
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        setLearner(data.learnerData || null);
        setStatus(data.applicationStatus || "pending_registration");
        setDocs(data.complianceDocs || []);
      }
    } catch (err) {
      console.error("Error fetching registration:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
  }, [user, showForm]);

  // 📂 Upload new documents (replace or add)
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

      // Merge old + new docs
      const updatedDocs = [...docs, ...newUrls];
      await updateDoc(doc(db, "parents", user.uid), { complianceDocs: updatedDocs });
      setDocs(updatedDocs);
    } catch (err) {
      console.error("Error uploading documents:", err);
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑 Delete a document
  const handleDeleteDoc = async (url: string) => {
    if (!user?.uid) return;
    try {
      // Extract file path from URL
      const pathStart = url.indexOf("/o/") + 3;
      const pathEnd = url.indexOf("?");
      const fullPath = decodeURIComponent(url.substring(pathStart, pathEnd));

      const storageRef = ref(storage, fullPath);
      await deleteObject(storageRef);

      const updatedDocs = docs.filter((d) => d !== url);
      await updateDoc(doc(db, "parents", user.uid), { complianceDocs: updatedDocs });
      setDocs(updatedDocs);
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Delete failed. Try again.");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  // 🔹 Show ParentRegistration form if clicked
  if (showForm && user?.uid) {
    return <ParentRegistration />;
  }

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

      {/* ➕ Add or Update Registration */}
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowForm(true)}
      >
        {learner ? "✏️ Update Registration" : "➕ Register Child"}
      </button>

      {/* Registration Summary */}
      {learner ? (
        <div className="mt-4 p-4 border rounded bg-white shadow-sm space-y-3">
          <p className="font-semibold">
            {learner.firstName} {learner.lastName} – Grade {learner.grade}
          </p>
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span
              className={
                status === "enrolled"
                  ? "text-green-600 font-medium"
                  : status === "submitted"
                  ? "text-yellow-600 font-medium"
                  : "text-red-600 font-medium"
              }
            >
              {status}
            </span>
          </p>

          {/* 📂 Uploaded Documents */}
          <div className="mt-3">
            <h4 className="font-semibold mb-2">Uploaded Documents</h4>
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
          </div>

          {/* Upload New Documents */}
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
      ) : (
        <p className="text-gray-600 mt-4">No registration found yet.</p>
      )}
    </div>
  );
}
