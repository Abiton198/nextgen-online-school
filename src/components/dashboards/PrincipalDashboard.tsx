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
  getDoc,
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
  id: string;
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
  const [chatRecipient, setChatRecipient] = useState<string | null>(null);

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
    const unsubStudents = onSnapshot(collection(db, "students"), async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Student) }));
      setStudents(list);

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

    const unsubTeachers = onSnapshot(collection(db, "teacherApplications"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeacherApplication) })));
    });

    return () => {
      unsubStudents();
      unsubTeachers();
    };
  }, []);

  /* ---------------- Payment History ---------------- */
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

  // ✅ Unified approval flow with parent-student link
  const approve = async (
    col: "students" | "teacherApplications",
    item: Student | TeacherApplication
  ) => {
    const id = item.id;

    // --- Student Approval ---
    if (col === "students") {
      await updateStatus(col, id, {
        status: "enrolled",
        principalReviewed: true,
        reviewedAt: serverTimestamp(),
      });

      // Link student to parent user account
      const studentDoc = await getDoc(doc(db, "students", id));
      if (studentDoc.exists()) {
        const s = studentDoc.data() as Student;
        if (s.parentId) {
          await setDoc(
            doc(db, "users", s.parentId),
            {
              uid: s.parentId,
              role: "student",
              email: s.parentEmail || "",
              linkedStudentId: id,
              approvedByPrincipal: true,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      return;
    }

    // --- Teacher Approval ---
    if (col === "teacherApplications") {
      const app = item as TeacherApplication;
      const uid = app.uid || app.id;

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
            uid,
            status: "approved",
            classActivated: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

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
  };

  const reject = async (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "rejected", principalReviewed: true, reviewedAt: serverTimestamp() });

  const suspend = (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "suspended", suspendedAt: serverTimestamp() });

  const toggleClassActivation = async (
    item: Student | TeacherApplication,
    col: "students" | "teacherApplications"
  ) => {
    const next = !item.classActivated;
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
      const rootRef =
        col === "teacherApplications" && uid
          ? ref(storage, `teacherApplications/${id}/${uid}/documents`)
          : ref(storage, `${col}/${id}/documents`);
      return await getAllFiles(rootRef);
    } catch (err) {
      console.error("Error fetching documents:", err);
      return {};
    }
  };

  /* ---------------- Helpers ---------------- */
  const getStudentStatusColor = (status?: string) => {
    switch (status) {
      case "enrolled":
        return "text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs font-medium";
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium";
      case "rejected":
        return "text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs font-medium";
      case "suspended":
        return "text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs font-medium";
      default:
        return "text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs";
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ---------------- Render ---------------- */
  const renderUsersCard = (
    title: string,
    users: (Student | TeacherApplication)[],
    col: "students" | "teacherApplications"
  ) => {
    const filtered = users.filter((u) => {
      const first =
        (u as Student).firstName ||
        (u as Student).learnerData?.firstName ||
        (u as TeacherApplication).firstName ||
        "";
      const last =
        (u as Student).lastName ||
        (u as Student).learnerData?.lastName ||
        (u as TeacherApplication).lastName ||
        "";
      const email =
        (u as Student).parentEmail ||
        (u as Student).parentData?.email ||
        (u as TeacherApplication).email ||
        "";
      const hay = `${first} ${last} ${email}`.toLowerCase();
      return hay.includes(searchTerm.toLowerCase());
    });

    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 && <p className="text-sm text-gray-500">No records.</p>}
          <ul className="space-y-3">
            {filtered.map((u) => {
              const isStudent = col === "students";
              const name = isStudent
                ? `${(u as Student).firstName ?? (u as Student).learnerData?.firstName ?? ""} ${
                    (u as Student).lastName ?? (u as Student).learnerData?.lastName ?? ""
                  }`.trim() || "—"
                : `${(u as TeacherApplication).firstName ?? ""} ${(u as TeacherApplication).lastName ?? ""}`.trim();
              const email = isStudent
                ? (u as Student).parentEmail ?? (u as Student).parentData?.email ?? "—"
                : (u as TeacherApplication).email ?? "—";
              const status = (u as any).status ?? (u as any).applicationStatus ?? "pending";

              return (
                <li key={u.id} className="p-3 border rounded bg-gray-50">
                  <div className="mb-2">
                    <p className="font-medium flex items-center gap-2">
                      {name}
                      <span className={getStudentStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(u, col)}>
                      Review Details
                    </Button>

                    {status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approve(col, u)}
                      >
                        Approve
                      </Button>
                    )}
                    {status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reject(col, u.id)}
                      >
                        Reject
                      </Button>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderUsersCard("Students", students, "students")}
        {renderUsersCard("Teachers", teachers, "teacherApplications")}
      </div>

      <TimetableManager />

      {auth.currentUser && chatRecipient && (
        <div className="fixed bottom-6 right-6 z-50">
       
        <ChatWidget
          uid={auth.currentUser?.uid || ""}
          role="principal"
          initialRecipient={chatRecipient}
          forceOpen={true}
          onClose={() => setChatRecipient(null)}
        />
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
