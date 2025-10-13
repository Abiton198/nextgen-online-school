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
  deleteDoc,
  getDocs,
  getDoc, // ✅ needed to fetch /parents/{parentId}
} from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import TimetableManager from "@/lib/TimetableManager";
import ChatWidget from "../chat/ChatWidget";

/* ---------------- Types ---------------- */
interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  parentEmail?: string;
  parentId?: string;
  learnerData?: {
    firstName?: string;
    lastName?: string;
    grade?: string;
  };
  parentData?: {
    name?: string;
    email?: string;
  };
  applicationStatus?: "pending" | "enrolled" | "rejected" | "suspended";
  status?: string;
  principalReviewed?: boolean;
  createdAt?: any;
  reviewedAt?: any;
  classActivated?: boolean;
}

interface TeacherApplication {
  id: string;
  uid?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
}

interface ParentDoc {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  createdAt?: any;
}

interface ParentAgg {
  id: string; // parent UID (from /parents/{uid})
  name: string;
  email: string;
  photoURL?: string | null;
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
  const [students, setStudents] = useState<Student[]>([]);
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
    "teacherApplications" | "students" | "parents" | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<Record<string, { name: string; url: string }[]>>({});
  const [activeTab, setActiveTab] = useState<"Details" | "Documents">("Details");

  /* ---------------- Chat State ---------------- */
  const [chatRecipient, setChatRecipient] = useState<string | null>(null); // parent uid

  /* ---------------- Utilities ---------------- */
  const openModal = async (item: any, type: "teacherApplications" | "students" | "parents") => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);
    setActiveTab("Details");

    if (type === "teacherApplications") {
      const docs = await fetchDocuments(type, item.id, item.uid);
      setDocuments(docs);
    } else if (type === "students") {
      // if you store registration docs/media under /registrations/{studentId}/documents
      const docs = await fetchDocuments("registrations", item.id);
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
    // Students
    const unsubStudents = onSnapshot(collection(db, "students"), async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Student) }));
      setStudents(list);

      // Build parent aggregates (fetch parent's name/email/photo from /parents/{parentId})
      const parentMap: Record<string, ParentAgg> = {};

      for (const s of list) {
        const parentId = s.parentId;
        if (!parentId) continue;

        if (!parentMap[parentId]) {
          const pDoc = await getDoc(doc(db, "parents", parentId));
          if (pDoc.exists()) {
            const pData = pDoc.data() as ParentDoc;
            parentMap[parentId] = {
              id: parentId,
              name: pData.name || "(Unknown Parent)",
              email: pData.email || s.parentEmail || "",
              photoURL: pData.photoURL || null,
              children: [],
            };
          } else {
            // fallback to fields on student doc
            parentMap[parentId] = {
              id: parentId,
              name: s.parentData?.name || "(Unknown Parent)",
              email: s.parentData?.email || s.parentEmail || "",
              photoURL: null,
              children: [],
            };
          }
        }

        const childName =
          `${s.firstName ?? s.learnerData?.firstName ?? ""} ${s.lastName ?? s.learnerData?.lastName ?? ""}`.trim() ||
          "(Unnamed)";
        const childGrade = s.grade ?? s.learnerData?.grade ?? "-";
        const childStatus = s.status ?? s.applicationStatus ?? "pending";

        parentMap[parentId].children.push({
          name: childName,
          grade: String(childGrade),
          status: childStatus,
        });
      }

      setParents(Object.values(parentMap));
    });

    // Teachers
    const unsubTeachers = onSnapshot(collection(db, "teacherApplications"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeacherApplication) })));
    });

    return () => {
      unsubStudents();
      unsubTeachers();
    };
  }, []);

  // (Optional) Payment history: if you track by registration id, adapt as needed
  useEffect(() => {
    (async () => {
      const out: Record<string, Payment[]> = {};
      for (const s of students) {
        const payRef = collection(db, "registrations", s.id, "payments");
        const q = fsQuery(payRef, orderBy("processedAt", "desc"));
        const paySnap = await getDocs(q);
        out[s.id] = paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      }
      setPayments(out);
    })();
  }, [students]);

/* ---------------- Firestore Actions ---------------- */
const updateStatus = async (
  col: "students" | "teacherApplications",
  id: string,
  updates: Record<string, any>
) => updateDoc(doc(db, col, id), updates);

const approve = async (
  col: "students" | "teacherApplications",
  item: Student | TeacherApplication
) => {
  const id = item.id;

  if (col === "students") {
    await updateStatus(col, id, {
      status: "enrolled",
      principalReviewed: true,
      reviewedAt: serverTimestamp(),
    });
    return;
  }

  if (col === "teacherApplications") {
    const app = item as TeacherApplication;
    // ✅ Fallback if uid is missing
    const uid = app.uid || app.id;

    await updateStatus("teacherApplications", id, {
      status: "approved",
      principalReviewed: true,
      reviewedAt: serverTimestamp(),
      classActivated: true,
    });

    if (uid) {
      // 🔹 Create or update teacher profile
      await setDoc(
        doc(db, "teachers", uid),
        {
          ...app,
          uid, // ensure uid exists in teacher profile
          status: "approved",
          classActivated: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ Also ensure role assignment in users collection
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          email: app.email || "",
          role: "teacher",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  // 🧹 Optional: Cleanup users if rejected
  else if (col === "teacherApplications" && (item as any).status === "rejected") {
    const uid = (item as any).uid || item.id;
    await deleteDoc(doc(db, "users", uid));
  }
};



  const reject = async (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "rejected", principalReviewed: true, reviewedAt: serverTimestamp() });

  const suspend = (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "suspended", suspendedAt: serverTimestamp() });

  const reinstate = (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, {
      status: col === "students" ? "enrolled" : "approved",
      reinstatedAt: serverTimestamp(),
    });

  const toggleClassActivation = async (
    item: Student | TeacherApplication,
    col: "students" | "teacherApplications"
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
  const filterStudents = (users: Student[]): Student[] => {
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

  /* ---------------- Small UI Helpers ---------------- */
  const getStudentName = (s: Student) =>
    `${s.firstName ?? s.learnerData?.firstName ?? ""} ${s.lastName ?? s.learnerData?.lastName ?? ""}`.trim() ||
    "—";

  const getStudentParentEmail = (s: Student) =>
    s.parentData?.email ?? s.parentEmail ?? "—";

  const getStudentStatus = (s: Student) =>
    s.status ?? s.applicationStatus ?? "pending";

  /* ---------------- Render ---------------- */
  const renderUsersCard = (
    title: string,
    users: (Student | TeacherApplication)[],
    col: "students" | "teacherApplications"
  ) => {
    const filtered = users.filter((u) => {
      const first =
        (u as Student).learnerData?.firstName ||
        (u as Student).firstName ||
        (u as TeacherApplication).firstName ||
        "";
      const last =
        (u as Student).learnerData?.lastName ||
        (u as Student).lastName ||
        (u as TeacherApplication).lastName ||
        "";
      const email =
        (u as Student).parentData?.email ||
        (u as Student).parentEmail ||
        (u as TeacherApplication).email ||
        "";
      const hay = `${first} ${last} ${email}`.toLowerCase();
      return hay.includes(searchTerm.toLowerCase());
    });

    const displayUsers = col === "students" ? filterStudents(filtered as Student[]) : filtered;

    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 && <p className="text-sm text-gray-500">No records.</p>}
          <ul className="space-y-3">
            {displayUsers.map((u) => {
              const isStudent = (u as Student).id && (u as Student).parentId !== undefined;
              const name = isStudent
                ? getStudentName(u as Student)
                : `${(u as TeacherApplication).firstName ?? ""} ${(u as TeacherApplication).lastName ?? ""}`.trim() ||
                  "—";
              const email = isStudent ? getStudentParentEmail(u as Student) : (u as TeacherApplication).email || "—";
              const status = isStudent ? getStudentStatus(u as Student) : (u as any).status ?? "pending";

              return (
                <li key={u.id} className="p-3 border rounded bg-gray-50">
                  <div className="mb-3">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-gray-500">{email}</p>
                    <p className="text-xs text-gray-400">Status: {status}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(u, col)}>
                      Review Details
                    </Button>

                    {status !== "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600"
                          onClick={() => suspend(col, u.id)}
                        >
                          Suspend
                        </Button>
                        {"classActivated" in u && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleClassActivation(u as any, col)}
                          >
                            {(u as any).classActivated ? "Freeze Class" : "Unfreeze Class"}
                          </Button>
                        )}
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
                <div className="mb-2 flex items-center gap-3">
                  {p.photoURL ? (
                    <img
                      src={p.photoURL}
                      alt={p.name}
                      className="h-8 w-8 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {p.name?.charAt(0) ?? "P"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <p className="font-semibold mb-1">Children:</p>
                  <ul className="list-disc ml-5">
                    {p.children.map((c, i) => (
                      <li key={i}>
                        {c.name} — Grade {c.grade} ({c.status})
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ✅ Start Chat Button (uses parent UID) */}
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setChatRecipient(p.id)}
                >
                  Start Chat
                </Button>
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
        {renderUsersCard("Students", students, "students")}
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
              Review{" "}
              {selectedType === "teacherApplications"
                ? "Teacher Application"
                : selectedType === "students"
                ? "Student Registration"
                : "Parent"}
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

            {/* Teacher Details */}
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

            {/* Student Details */}
            {activeTab === "Details" && selectedType === "students" && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                <h3 className="text-lg font-semibold mb-3">👨‍🎓 Student Information</h3>
                <p>
                  <span className="font-medium">Learner:</span>{" "}
                  {getStudentName(selectedItem)}
                </p>
                <p>
                  <span className="font-medium">Grade:</span>{" "}
                  {selectedItem.grade ?? selectedItem.learnerData?.grade ?? "-"}
                </p>
                <p>
                  <span className="font-medium">Parent:</span>{" "}
                  {selectedItem.parentData?.name ?? "(See Parents card)"}
                </p>
                <p>
                  <span className="font-medium">Parent Email:</span>{" "}
                  {getStudentParentEmail(selectedItem)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {getStudentStatus(selectedItem)}
                </p>
              </div>
            )}

            {/* Parent Details */}
            {activeTab === "Details" && selectedType === "parents" && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                <h3 className="text-lg font-semibold mb-3">👪 Parent Information</h3>
                <p>
                  <span className="font-medium">Name:</span> {selectedItem.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {selectedItem.email}
                </p>
                <h4 className="mt-3 font-semibold">Children:</h4>
                <ul className="list-disc ml-5">
                  {selectedItem.children.map((c: any, i: number) => (
                    <li key={i}>
                      {c.name} — Grade {c.grade} ({c.status})
                    </li>
                  ))}
                </ul>
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

                          {/* Image Preview */}
                          {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="mt-2 rounded border max-h-96 object-contain"
                            />
                          )}

                          {/* PDF Preview */}
                          {file.name.match(/\.pdf$/i) && (
                            <iframe
                              src={file.url}
                              className="w-full h-[600px] mt-2 border rounded"
                              title={file.name}
                            ></iframe>
                          )}

                          {/* Docs/Excel/PPT Preview */}
                          {file.name.match(/\.(docx?|xlsx?|pptx?)$/i) && (
                            <iframe
                              src={`https://docs.google.com/gview?url=${encodeURIComponent(
                                file.url
                              )}&embedded=true`}
                              className="w-full h-[600px] mt-2 border rounded"
                              title={file.name}
                            ></iframe>
                          )}

                          {/* Fallback */}
                          {!file.name.match(
                            /\.(jpg|jpeg|png|gif|webp|pdf|docx?|xlsx?|pptx?)$/i
                          ) && (
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

            {/* Approve / Reject Buttons */}
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

      {/* Timetable Manager */}
      <TimetableManager />

      {/* ✅ Floating Chat Window – opens when you click “Start Chat” on a parent */}
      {chatRecipient && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatWidget
            uid={auth.currentUser?.uid || "principal"}
            role="principal"
            initialRecipient={chatRecipient} // parent UID
            forceOpen={true}
            onClose={() => setChatRecipient(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
