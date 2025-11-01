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

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import TimetableManager from "@/lib/TimetableManager";
import ChatWidget from "../chat/ChatWidget";
import { Search, Clock, Users, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react";

/* ---------------- Types ---------------- */
interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  parentEmail?: string;
  parentId?: string;
  subjects?: string[];
  status?: "pending" | "enrolled" | "rejected" | "suspended";
  principalReviewed?: boolean;
  createdAt?: any;
  reviewedAt?: any;
  classActivated?: boolean;
}

interface Teacher {
  id: string;
  uid?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  subjects?: string[];
  status?: "pending" | "approved" | "rejected";
  classActivated?: boolean;
}

interface ParentAgg {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  children: { id: string; name: string; grade: string; status: string; paid: boolean }[];
}

interface Payment {
  id: string;
  amount?: string;
  paymentStatus?: "paid" | "pending" | "failed";
  processedAt?: any;
}

/* ---------------- Main Component ---------------- */
const PrincipalDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<ParentAgg[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [time, setTime] = useState(new Date());

  const principalName = auth.currentUser?.displayName || "Principal";
  const schoolName = "Nextgen Online Support School";
  const { logout } = useAuth();
  const navigate = useNavigate();

  /* ---------------- Modal State ---------------- */
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<"teacher" | "student" | "parent" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<Record<string, { name: string; url: string }[]>>({});
  const [activeTab, setActiveTab] = useState<"Details" | "Documents" | "Payments">("Details");

  /* ---------------- Chat State ---------------- */
  const [chatRecipient, setChatRecipient] = useState<string | null>(null);

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
      const paymentMap: Record<string, Payment[]> = {};

      for (const s of list) {
        const parentId = s.parentId;
        if (!parentId) continue;

        if (!parentMap[parentId]) {
          const pDoc = await getDoc(doc(db, "parents", parentId));
          const pData = pDoc.exists() ? pDoc.data() : {};
          parentMap[parentId] = {
            id: parentId,
            name: pData.name || "(Unknown)",
            email: pData.email || s.parentEmail || "",
            photoURL: pData.photoURL || null,
            children: [],
          };
        }

        const childName = `${s.firstName || ""} ${s.lastName || ""}`.trim() || "(Unnamed)";
        const childStatus = s.status || "pending";
        const hasPaid = payments[s.id]?.some(p => p.paymentStatus === "paid") || false;

        parentMap[parentId].children.push({
          id: s.id,
          name: childName,
          grade: s.grade || "-",
          status: childStatus,
          paid: hasPaid,
        });

        // Fetch payments
        const payRef = collection(db, "registrations", s.id, "payments");
        const paySnap = await getDocs(fsQuery(payRef, orderBy("processedAt", "desc")));
        paymentMap[s.id] = paySnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      }

      setPayments(paymentMap);
      setParents(Object.values(parentMap));
    });

    const unsubTeachers = onSnapshot(collection(db, "teacherApplications"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Teacher) })));
    });

    return () => {
      unsubStudents();
      unsubTeachers();
    };
  }, []);

  /* ---------------- Firestore Actions ---------------- */
  const updateStatus = async (
    col: "students" | "teacherApplications",
    id: string,
    updates: Record<string, any>
  ) => updateDoc(doc(db, col, id), updates);

  const approve = async (col: "students" | "teacherApplications", item: any) => {
    const id = item.id;

    if (col === "students") {
      await updateStatus(col, id, {
        status: "enrolled",
        principalReviewed: true,
        reviewedAt: serverTimestamp(),
      });
    }

    if (col === "teacherApplications") {
      const uid = item.uid || id;
      await updateStatus(col, id, {
        status: "approved",
        principalReviewed: true,
        reviewedAt: serverTimestamp(),
        classActivated: true,
      });

      await setDoc(doc(db, "teachers", uid), { ...item, uid, status: "approved" }, { merge: true });
      await setDoc(doc(db, "users", uid), { uid, role: "teacher" }, { merge: true });
    }
  };

  const reject = async (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "rejected", principalReviewed: true, reviewedAt: serverTimestamp() });

  const suspend = (col: "students" | "teacherApplications", id: string) =>
    updateStatus(col, id, { status: "suspended", suspendedAt: serverTimestamp() });

  const toggleClassActivation = async (item: any, col: "students" | "teacherApplications") => {
    const next = !item.classActivated;
    await updateStatus(col, item.id, { classActivated: next });
  };

  /* ---------------- Fetch Documents ---------------- */
  const fetchDocuments = async (col: "registrations" | "teacherApplications", id: string, uid?: string) => {
    const storage = getStorage();
    const rootRef = col === "teacherApplications" && uid
      ? ref(storage, `teacherApplications/${id}/${uid}/documents`)
      : ref(storage, `${col}/${id}/documents`);

    const result = await listAll(rootRef);
    const files: { name: string; url: string }[] = [];

    for (const item of result.items) {
      const url = await getDownloadURL(item);
      files.push({ name: item.name, url });
    }

    return { "Documents": files };
  };

  /* ---------------- Filters ---------------- */
  const filteredStudents = students.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = (s.parentEmail || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const filteredTeachers = teachers.filter(t => {
    const name = `${t.firstName} ${t.lastName}`.toLowerCase();
    const email = (t.email || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  /* ---------------- UI Helpers ---------------- */
  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (paid) return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    switch (status) {
      case "enrolled": return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "suspended": return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  /* ---------------- Modal ---------------- */
  const openModal = async (item: any, type: "teacher" | "student" | "parent") => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);
    setActiveTab("Details");

    if (type === "teacher") {
      const docs = await fetchDocuments("teacherApplications", item.id, item.uid);
      setDocuments(docs);
    } else if (type === "student") {
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Welcome, {principalName}</h1>
          <p className="text-indigo-600 flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4" />
            {schoolName} | {time.toLocaleDateString("en-ZA")} {time.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students, teachers, parents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <Users className="w-8 h-8 opacity-70" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Teachers</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.status === "approved").length}</p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-70" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending Reviews</p>
              <p className="text-2xl font-bold">{students.filter(s => s.status === "pending").length + teachers.filter(t => t.status === "pending").length}</p>
            </div>
            <AlertCircle className="w-8 h-8 opacity-70" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Paid Students</p>
              <p className="text-2xl font-bold">{Object.values(payments).flat().filter(p => p.paymentStatus === "paid").length}</p>
            </div>
            <DollarSign className="w-8 h-8 opacity-70" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Students
              <Badge variant="secondary">{filteredStudents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.map(s => {
                const paid = payments[s.id]?.some(p => p.paymentStatus === "paid") || false;
                return (
                  <div key={s.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-sm text-gray-600">Grade {s.grade}</p>
                        <div className="flex gap-2 mt-1">
                          {getStatusBadge(s.status, paid)}
                          {s.subjects && s.subjects.map(sub => (
                            <Badge key={sub} variant="outline" className="text-xs">{sub}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openModal(s, "student")}>
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Teachers */}
        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTeachers.map(t => (
                <div key={t.id} className="p-3 border rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                  <p className="font-medium">{t.firstName} {t.lastName}</p>
                  <p className="text-sm text-gray-600">{t.email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {t.subjects?.map(sub => (
                      <Badge key={sub} variant="secondary" className="text-xs">{sub}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {t.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approve("teacherApplications", t)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => reject("teacherApplications", t.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable Manager */}
      <TimetableManager />

      {/* Chat Widget */}
      {auth.currentUser && chatRecipient && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatWidget
            uid={auth.currentUser.uid}
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