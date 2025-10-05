"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query as fsQuery,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

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
  status: "pending_review" | "enrolled" | "rejected" | "suspended";
  principalReviewed?: boolean;
  classActivated?: boolean;
  parentId?: string;
}

interface TeacherApplication {
  id: string; // applicationId
  uid?: string; // teacher’s Firebase Auth UID
  [key: string]: any; // dynamic fields
}

interface ParentAgg {
  id: string;
  name: string;
  email: string;
  children: { name: string; grade: string; status: string }[];
}

interface Payment {
  id: string;
  amount?: string;
  paymentStatus?: string;
  processedAt?: any;
}

/* ---------------- Main Component ---------------- */
const PrincipalDashboard: React.FC = () => {
  const [students, setStudents] = useState<Registration[]>([]);
  const [teachers, setTeachers] = useState<TeacherApplication[]>([]);
  const [parents, setParents] = useState<ParentAgg[]>([]);
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
  const [activeTab, setActiveTab] = useState<"Details" | "Documents">("Details");

  /* ---------------- Utilities ---------------- */
  const openModal = async (
    item: any,
    type: "teacherApplications" | "registrations" | "parents"
  ) => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);
    setActiveTab("Details");

    if (type === "teacherApplications") {
      const docs = await fetchDocuments(type, item.id, item.uid);
      setDocuments(docs);
    } else if (type === "registrations") {
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

      const parentMap: Record<string, ParentAgg> = {};
      regs.forEach((reg) => {
        const pEmail = reg.parentData?.email;
        if (!pEmail) return;

        if (!parentMap[pEmail]) {
          parentMap[pEmail] = {
            id: pEmail,
            name: reg.parentData?.name || "Unknown Parent",
            email: pEmail,
            children: [],
          };
        }
        parentMap[pEmail].children.push({
          name: `${reg.learnerData?.firstName || ""} ${reg.learnerData?.lastName || ""}`.trim(),
          grade: reg.learnerData?.grade || "-",
          status: reg.status,
        });
      });
      setParents(Object.values(parentMap));

      for (const reg of regs) {
        const payRef = collection(db, "registrations", reg.id, "payments");
        const q = fsQuery(payRef, orderBy("processedAt", "desc"));
        const paySnap = await getDocs(q);
        const history: Payment[] = paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setPayments((prev) => ({ ...prev, [reg.id]: history }));
      }
    });

    const unsubTeachers = onSnapshot(collection(db, "teacherApplications"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeacherApplication) })));
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

  const approve = async (
    col: "registrations" | "teacherApplications",
    item: Registration | TeacherApplication
  ) => {
    const id = item.id;

    if (col === "registrations") {
      await updateStatus(col, id, {
        status: "enrolled",
        principalReviewed: true,
        reviewedAt: serverTimestamp(),
      });
      return;
    }

    const app = item as TeacherApplication;
    const uid = app.uid;
    await updateStatus("teacherApplications", id, {
      status: "approved",
      principalReviewed: true,
      reviewedAt: serverTimestamp(),
      classActivated: true,
    });

    if (uid) {
      await setDoc(
        doc(db, "teachers", uid),
        {
          ...app,
          status: "approved",
          classActivated: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const reject = async (col: "registrations" | "teacherApplications", id: string) =>
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

  const toggleClassActivation = async (
    item: Registration | TeacherApplication,
    col: "registrations" | "teacherApplications"
  ) => {
    const current = Boolean(item.classActivated);
    const next = !current;

    await updateStatus(col, item.id, { classActivated: next });

    if (col === "teacherApplications") {
      const t = item as TeacherApplication;
      if (t.uid) {
        await setDoc(
          doc(db, "teachers", t.uid),
          { classActivated: next, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    }
  };

  /* ---------------- Fetch Documents ---------------- */
  const fetchDocuments = async (
    col: "registrations" | "teacherApplications",
    id: string,
    uid?: string
  ): Promise<Record<string, { name: string; url: string }[]>> => {
    const storage = getStorage();

    const getAllFiles = async (folderRef: any): Promise<Record<string, { name: string; url: string }[]>> => {
      const result = await listAll(folderRef);
      const grouped: Record<string, { name: string; url: string }[]> = {};

      if (result.items.length > 0) {
        const folderName = folderRef.name || "root";
        grouped[folderName] = await Promise.all(
          result.items.map(async (item: any) => ({
            name: item.name,
            url: await getDownloadURL(item),
          }))
        );
      }

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
      let rootRef;
      if (col === "teacherApplications" && uid) {
        // ✅ Fix: applicationId first, then uid
        rootRef = ref(storage, `teacherApplications/${id}/${uid}/documents`);
      } else {
        rootRef = ref(storage, `${col}/${id}/documents`);
      }

      return await getAllFiles(rootRef);
    } catch (err) {
      console.error("Error fetching documents:", err);
      return {};
    }
  };

  /* ---------------- Helpers ---------------- */
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

  /* ---------------- Render ---------------- */
  const renderUsersCard = (
    title: string,
    users: (Registration | TeacherApplication)[],
    col: "registrations" | "teacherApplications"
  ) => {
    const filtered = users.filter((u) => {
      const first = (u as any).learnerData?.firstName || (u as any).firstName || "";
      const last = (u as any).learnerData?.lastName || (u as any).lastName || "";
      const email = (u as any).parentData?.email || (u as any).email || "";
      const hay = `${first} ${last} ${email}`.toLowerCase();
      return hay.includes(searchTerm.toLowerCase());
    });

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
            {displayUsers.map((u) => {
              const isStudent = "learnerData" in u;
              const name = isStudent
                ? `${u.learnerData?.firstName ?? ""} ${u.learnerData?.lastName ?? ""}`.trim()
                : `${(u as TeacherApplication).firstName ?? ""} ${(u as TeacherApplication).lastName ?? ""}`.trim();

              const email = isStudent ? u.parentData?.email : (u as TeacherApplication).email;

              return (
                <li key={u.id} className="p-3 border rounded bg-gray-50">
                  <div className="mb-3">
                    <p className="font-medium">{name || "—"}</p>
                    <p className="text-xs text-gray-500">{email || "—"}</p>
                    <p className="text-xs text-gray-400">Status: {u.status}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(u, col)}>
                      Review Details
                    </Button>

                    {u.status !== "pending_review" && (
                      <>
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
                          onClick={() => toggleClassActivation(u, col)}
                        >
                          {u.classActivated ? "Freeze Class" : "Unfreeze Class"}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  };

  const renderParentsCard = (items: ParentAgg[]) => {
    const filtered = items.filter((p) =>
      `${p.name} ${p.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>Parents</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 && <p className="text-sm text-gray-500">No parent records.</p>}
          <ul className="space-y-3">
            {filtered.map((p) => (
              <li key={p.id} className="p-3 border rounded bg-gray-50">
                <div className="mb-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                </div>
                <div className="text-xs text-gray-600">
                  <p className="font-semibold mb-1">Children:</p>
                  <ul className="list-disc ml-5">
                    {p.children.map((c, i) => (
                      <li key={i}>
                        {c.name} — Grade {c.grade} ({c.status})
                      </li>
                    ))}
                  </ul>
                </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderUsersCard("Students", students, "registrations")}
        {renderUsersCard("Teachers", teachers, "teacherApplications")}
        {renderParentsCard(parents)}
      </div>

      {/* ✅ Modal */}
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

            <div className="flex border-b mb-4">
              {["Details", "Documents"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "Details" | "Documents")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Details: Teachers see ALL fields dynamically */}
            {activeTab === "Details" && selectedType === "teacherApplications" && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-6 space-y-2">
                {Object.entries(selectedItem).map(([key, value]) => (
                  <p key={key} className="text-sm">
                    <span className="font-medium capitalize">{key}:</span>{" "}
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </p>
                ))}
              </div>
            )}

            {activeTab === "Details" && selectedType === "registrations" && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                <h3 className="text-lg font-semibold mb-3">👨‍🎓 Student Information</h3>
                <p>
                  <span className="font-medium">Learner:</span>{" "}
                  {`${selectedItem.learnerData?.firstName || ""} ${selectedItem.learnerData?.lastName || ""}`.trim()}
                </p>
                <p><span className="font-medium">Grade:</span> {selectedItem.learnerData?.grade || "-"}</p>
                <p><span className="font-medium">Parent:</span> {selectedItem.parentData?.name || "-"}</p>
                <p><span className="font-medium">Parent Email:</span> {selectedItem.parentData?.email || "-"}</p>
                <p><span className="font-medium">Status:</span> {selectedItem.status}</p>
              </div>
            )}

            {/* Documents */}
            {activeTab === "Documents" && (
  <div className="border rounded-lg p-4 bg-gray-50">
    <h3 className="text-lg font-semibold mb-3">📂 Documents</h3>
    {Object.keys(documents).length > 0 ? (
      Object.entries(documents).map(([folder, files]) => (
        <div key={folder} className="mb-6">
          <h4 className="font-medium text-blue-700 mb-2">{folder}</h4>
          {files.map((file) => (
            <div key={file.name} className="mb-4">
              <p className="text-sm font-semibold">{file.name}</p>

              {/* ✅ Image Preview */}
              {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <img
                  src={file.url}
                  alt={file.name}
                  className="mt-2 rounded border max-h-96 object-contain"
                />
              )}

              {/* ✅ PDF Preview */}
              {file.name.match(/\.pdf$/i) && (
                <iframe
                  src={file.url}
                  className="w-full h-[600px] mt-2 border rounded"
                  title={file.name}
                ></iframe>
              )}

              {/* ✅ Word / Excel / PPT Preview via Google Docs Viewer */}
              {file.name.match(/\.(docx?|xlsx?|pptx?)$/i) && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    file.url
                  )}&embedded=true`}
                  className="w-full h-[600px] mt-2 border rounded"
                  title={file.name}
                ></iframe>
              )}

              {/* Fallback: show link if unsupported */}
              {!file.name.match(/\.(jpg|jpeg|png|gif|webp|pdf|docx?|xlsx?|pptx?)$/i) && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm mt-2 inline-block"
                >
                  View / Download
                </a>
              )}
            </div>
          ))}
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">No documents uploaded yet.</p>
    )}
  </div>
)}

            {/* Approve / Reject */}
            {selectedType !== "parents" && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    await approve(selectedType as any, selectedItem);
                    closeModal();
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await reject(selectedType as any, selectedItem.id);
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
