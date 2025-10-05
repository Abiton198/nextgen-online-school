"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "firebase/storage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/* ---------------- Types ---------------- */
interface Registration {
  id: string;
  learnerData?: { firstName?: string; lastName?: string; grade?: string };
  parentData?: { name?: string; email?: string };
  status: string;
  principalReviewed?: boolean;
  classActivated?: boolean;
}

interface Teacher {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: string;
  principalReviewed?: boolean;
  classActivated?: boolean;
  [key: string]: any;
}

interface Parent {
  id: string;
  name: string;
  email: string;
  children: { name: string; grade: string; status: string }[];
}

interface Payment {
  id: string;
  amount: string;
  paymentStatus: string;
  processedAt: any;
}

/* ---------------- Main Component ---------------- */
const PrincipalDashboard: React.FC = () => {
  const [students, setStudents] = useState<Registration[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "failed" | "latest">("all");
  const [time, setTime] = useState(new Date());

  const principalName = auth.currentUser?.displayName || "Principal";
  const schoolName = "Springfield Online School";
  const { logout } = useAuth();
  const navigate = useNavigate();

  /* ---------------- Modal State ---------------- */
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<
    "teacherApplications" | "registrations" | "parents" | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<Record<string, { name: string; url: string }[]>>({});

  /* ---------------- Utilities ---------------- */
  const openModal = async (
    item: any,
    type: "teacherApplications" | "registrations" | "parents"
  ) => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);

    // Load documents only for teacher/student
    if (type !== "parents") {
      const docs = await fetchDocuments(type, item.id);
      setDocuments(docs);
    } else {
      setDocuments({});
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedType(null);
    setShowModal(false);
    setDocuments({});
  };

  /* ---------------- Live Clock ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Firestore Listeners ---------------- */
  useEffect(() => {
    const unsubRegistrations = onSnapshot(collection(db, "registrations"), async (snap) => {
      const regs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Registration) }));
      setStudents(regs);

      // Build parent list dynamically
      const parentMap: Record<string, Parent> = {};
      regs.forEach((reg) => {
        if (reg.parentData?.email) {
          const pid = reg.parentData.email;
          if (!parentMap[pid]) {
            parentMap[pid] = {
              id: pid,
              name: reg.parentData.name || "Unknown Parent",
              email: reg.parentData.email,
              children: [],
            };
          }
          parentMap[pid].children.push({
            name: `${reg.learnerData?.firstName || ""} ${reg.learnerData?.lastName || ""}`,
            grade: reg.learnerData?.grade || "-",
            status: reg.status,
          });
        }
      });
      setParents(Object.values(parentMap));

      // Payment history
      for (const reg of regs) {
        const payRef = collection(db, "registrations", reg.id, "payments");
        const q = query(payRef, orderBy("processedAt", "desc"));
        const paySnap = await getDocs(q);
        const history: Payment[] = paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setPayments((prev) => ({ ...prev, [reg.id]: history }));
      }
    });

    const unsubTeachers = onSnapshot(collection(db, "teacherApplications"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Teacher) })));
    });

    return () => {
      unsubRegistrations();
      unsubTeachers();
    };
  }, []);

  /* ---------------- Firestore Actions ---------------- */
  const updateStatus = async (
    col: "registrations" | "teacherApplications",
    id: string,
    updates: Record<string, any>
  ) => updateDoc(doc(db, col, id), updates);

  const approve = (col: "registrations" | "teacherApplications", id: string) =>
    updateStatus(col, id, {
      status: col === "registrations" ? "enrolled" : "approved",
      principalReviewed: true,
      reviewedAt: serverTimestamp(),
    });

  const reject = (col: "registrations" | "teacherApplications", id: string) =>
    updateStatus(col, id, {
      status: "rejected",
      principalReviewed: true,
      reviewedAt: serverTimestamp(),
    });

  const suspend = (col: "registrations" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "suspended", suspendedAt: serverTimestamp() });

  const reinstate = (col: "registrations" | "teacherApplications", id: string) =>
    updateStatus(col, id, {
      status: col === "registrations" ? "enrolled" : "approved",
      reinstatedAt: serverTimestamp(),
    });

  const freezeClass = (col: "registrations" | "teacherApplications", id: string, frozen: boolean) =>
    updateStatus(col, id, { classActivated: !frozen });

  /* ---------------- Fetch Documents from Firebase Storage ---------------- */
  const fetchDocuments = async (
    col: "registrations" | "teacherApplications",
    id: string
  ): Promise<Record<string, { name: string; url: string }[]>> => {
    const storage = getStorage();

    // Recursive function to fetch all files grouped by folder
    const getAllFiles = async (folderRef: any): Promise<Record<string, { name: string; url: string }[]>> => {
      const result = await listAll(folderRef);
      const grouped: Record<string, { name: string; url: string }[]> = {};

      // Add direct files
      if (result.items.length > 0) {
        const folderName = folderRef.name || "root";
        grouped[folderName] = await Promise.all(
          result.items.map(async (item: any) => ({
            name: item.name,
            url: await getDownloadURL(item),
          }))
        );
      }

      // Process subfolders recursively
      for (const subRef of result.prefixes) {
        const subFiles = await getAllFiles(subRef);
        Object.entries(subFiles).forEach(([folder, files]) => {
          if (!grouped[folder]) grouped[folder] = [];
          grouped[folder].push(...files);
        });
      }
      return grouped;
    };

    try {
      const rootRef = ref(storage, `${col}/${id}`);
      const allFiles = await getAllFiles(rootRef);
      return allFiles;
    } catch (err) {
      console.error("Error fetching documents:", err);
      return {};
    }
  };

  /* ---------------- Helper Filters ---------------- */
  const filterStudents = (users: Registration[]): Registration[] => {
    if (filter === "failed") {
      return users.filter((u) => payments[u.id]?.some((p) => p.paymentStatus !== "COMPLETE"));
    }
    if (filter === "latest") {
      return [...users].sort((a, b) => {
        const aDate = payments[a.id]?.[0]?.processedAt?.toDate?.() || new Date(0);
        const bDate = payments[b.id]?.[0]?.processedAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    }
    return users;
  };

  const failedCount = students.filter((s) =>
    payments[s.id]?.some((p) => p.paymentStatus !== "COMPLETE")
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ---------------- Render Helpers ---------------- */
  const renderCard = (
    title: string,
    users: (Registration | Teacher)[],
    col: "registrations" | "teacherApplications"
  ) => {
    const filtered = users.filter((u) =>
      (u.learnerData?.firstName || u.firstName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (u.learnerData?.lastName || u.lastName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (u.parentData?.email || u.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const displayUsers =
      col === "registrations" ? filterStudents(filtered as Registration[]) : filtered;

    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 && <p className="text-sm text-gray-500">No records.</p>}
          <ul className="space-y-3">
            {displayUsers.map((u) => (
              <li key={u.id} className="p-3 border rounded bg-gray-50">
                {/* Info */}
                <div>
                  <p className="font-medium">
                    {"learnerData" in u
                      ? `${u.learnerData?.firstName ?? ""} ${u.learnerData?.lastName ?? ""}`
                      : `${u.firstName ?? ""} ${u.lastName ?? ""}`}
                  </p>
                  <p className="text-xs text-gray-500">{u.parentData?.email || u.email}</p>
                  <p className="text-xs text-gray-400">Status: {u.status}</p>
                </div>

                {/* Actions */}
                {u.status === "pending_review" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(u, col)}>
                      Review Details
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approve(col, u.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(col, u.id)}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600"
                      onClick={() => suspend(col, u.id)}
                    >
                      Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => freezeClass(col, u.id, u.classActivated === false)}
                    >
                      {u.classActivated === false ? "Unfreeze Class" : "Freeze Class"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  /* ---------------- Main Render ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Welcome, {principalName} 👋</h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            {schoolName} | {time.toLocaleDateString()} {time.toLocaleTimeString()}
          </p>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          type="text"
          placeholder="Search students, teachers, or parents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="all">All Students</option>
          <option value="failed">Failed Payments Only</option>
          <option value="latest">Sort by Latest Payment</option>
        </select>
        <span className="text-sm text-red-600 font-medium">
          🚨 {failedCount} students with failed payments
        </span>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCard("Students", students, "registrations")}
        {renderCard("Teachers", teachers, "teacherApplications")}
      </div>

      {/* ✅ Review Modal with Inline Previews */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={closeModal}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Review {selectedType === "teacherApplications" ? "Teacher Application" : "Student Registration"}
            </h2>

            {/* Document Section */}
            <div className="space-y-4">
              {Object.keys(documents).length > 0 ? (
                Object.entries(documents).map(([folder, files]) => (
                  <div key={folder} className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="font-medium text-blue-700 capitalize mb-2">
                      📁 {folder}
                    </h4>
                    {files.map((file) => (
                      <div key={file.name} className="mb-3">
                        <p className="text-sm font-semibold">{file.name}</p>

                        {/* Inline Preview */}
                        {file.name.match(/\.(jpg|jpeg|png)$/i) && (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="mt-2 rounded-lg border max-h-64 object-contain"
                          />
                        )}
                        {file.name.match(/\.pdf$/i) && (
                          <iframe
                            src={file.url}
                            className="w-full h-64 mt-2 border rounded"
                            title={file.name}
                          ></iframe>
                        )}

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm mt-1 inline-block"
                        >
                          View / Download
                        </a>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              )}
            </div>

            {/* Approve/Reject Buttons */}
            {selectedType !== "parents" && (
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    approve(selectedType as any, selectedItem.id);
                    closeModal();
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    reject(selectedType as any, selectedItem.id);
                    closeModal();
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
