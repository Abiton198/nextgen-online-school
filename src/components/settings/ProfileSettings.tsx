"use client";

import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// 🎨 Generate a consistent color from a string (e.g. name or email)
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

// 🅰️ Get initials from name/email
function getInitials(name: string, email: string) {
  if (name) {
    const parts = name.split(" ");
    return parts.length > 1
      ? parts[0][0] + parts[1][0]
      : parts[0][0];
  }
  return email ? email[0] : "?";
}

export default function ProfileSettings() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [role, setRole] = useState<
    "parent" | "student" | "teacher" | "principal" | "admin" | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const user = auth.currentUser;

  const getCollectionName = (role: string) => {
    switch (role) {
      case "parent": return "parents";
      case "student": return "students";
      case "teacher": return "teachers";
      case "principal": return "principals";
      case "admin": return "admins";
      default: return null;
    }
  };

  // 🔹 Load profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userRole = userData.role as
            | "parent"
            | "student"
            | "teacher"
            | "principal"
            | "admin";

          setRole(userRole);

          const collectionName = getCollectionName(userRole);
          if (collectionName) {
            const refDoc = doc(db, collectionName, user.uid);
            const snap = await getDoc(refDoc);
            if (snap.exists()) {
              const data = snap.data();
              setName(data.name || "");
              setContact(data.contact || "");
              setEmail(data.email || user.email || "");
              setAddress(data.address || "");
              setPhotoURL(data.photoURL || "");
            } else {
              setEmail(user.email || "");
            }
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  // 🔹 Upload profile picture
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !role || !e.target.files?.[0]) return;
    setUploading(true);

    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPhotoURL(url);

      const collectionName = getCollectionName(role);
      if (collectionName) {
        await setDoc(
          doc(db, collectionName, user.uid),
          { photoURL: url, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: url, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.error("Error uploading picture:", err);
      alert("Failed to upload picture ❌");
    }

    setUploading(false);
  };

  // 🔹 Remove profile picture
  const handleRemovePicture = async () => {
    if (!user || !role) return;
    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await deleteObject(storageRef).catch(() => {
        // ignore if file doesn't exist
      });

      setPhotoURL("");

      // Update Firestore
      const collectionName = getCollectionName(role);
      if (collectionName) {
        await setDoc(
          doc(db, collectionName, user.uid),
          { photoURL: "", updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: "", updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.error("Error removing picture:", err);
      alert("Failed to remove picture ❌");
    }
  };

  // 🔹 Save updated profile
  const handleSave = async () => {
    if (!user || !role) return;
    setSaving(true);

    try {
      const collectionName = getCollectionName(role);
      if (!collectionName) return;

      const refDoc = doc(db, collectionName, user.uid);
      await setDoc(
        refDoc,
        { name, contact, email, address, photoURL, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", user.uid),
        { name, contact, email, address, photoURL, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      alert("Profile updated successfully ✅");
      setEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile ❌");
    }

    setSaving(false);
  };

  if (loading) return <p>Loading profile...</p>;

  const initials = getInitials(name, email).toUpperCase();
  const bgColor = stringToColor(name || email);

  return (
    <div className="space-y-4 max-w-md border rounded-lg p-4 shadow bg-white">
      <h2 className="text-xl font-semibold">⚙️ Profile Settings</h2>
      {role && <p className="text-sm text-gray-500">Role: {role}</p>}

      {/* Profile Picture / Avatar */}
      <div className="flex flex-col items-center space-y-2">
        {photoURL ? (
          <img
            src={photoURL}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
        {editing && (
          <div className="flex gap-2">
            <label className="cursor-pointer px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              {uploading ? "Uploading..." : "Change Picture"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {photoURL && (
              <button
                type="button"
                onClick={handleRemovePicture}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {!editing ? (
        // ---------------- View Mode ----------------
        <div className="space-y-2">
          <p><span className="font-medium">Full Name:</span> {name || "—"}</p>
          <p><span className="font-medium">Contact:</span> {contact || "—"}</p>
          <p><span className="font-medium">Email:</span> {email || "—"}</p>
          <p><span className="font-medium">Address:</span> {address || "—"}</p>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        // ---------------- Edit Mode ----------------
        <form className="space-y-4">
          <div>
            <label className="block font-medium">Full Name</label>
            <input
              className="border p-2 w-full rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium">Contact Number</label>
            <input
              className="border p-2 w-full rounded"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              className="border p-2 w-full rounded bg-gray-100 text-gray-600 cursor-not-allowed"
              value={email}
              readOnly
            />
            <p className="text-xs text-gray-500">
              Email is managed by your account and cannot be changed here.
            </p>
          </div>

          <div>
            <label className="block font-medium">Address</label>
            <textarea
              className="border p-2 w-full rounded"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
