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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

// ---------------- Types ----------------
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

// ---------------- Principal Dashboard ----------------
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

  // ✅ NEW — Generic modal state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<
    "teacherApplications" | "registrations" | "parents" | null
  >(null);
  const [showModal, setShowModal] = useState(false);

  const openModal = (
    item: any,
    type: "teacherApplications" | "registrations" | "parents"
  ) => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);
  };
  const closeModal = () => {
    setSelectedItem(null);
    setSelectedType(null);
    setShowModal(false);
  };

  // ⏰ Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 Firestore listeners
  useEffect(() => {
    const unsubRegistrations = onSnapshot(collection(db, "registrations"), async (snap) => {
      const regs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Registration) }));
      setStudents(regs);

      // Parents list dynamically
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

  // ---------------- Firestore actions ----------------
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

  // ---------------- Helpers ----------------
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

  // ---------------- Render ----------------
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
              <li
                key={u.id}
                className={`p-3 border rounded flex flex-col gap-2 ${
                  "learnerData" in u &&
                  payments[u.id]?.some((p) => p.paymentStatus !== "COMPLETE")
                    ? "border-red-500 bg-red-50"
                    : "bg-gray-50"
                }`}
              >
                {/* Basic Info */}
                <div>
                  <p className="font-medium">
                    {"learnerData" in u
                      ? `${u.learnerData?.firstName ?? ""} ${u.learnerData?.lastName ?? ""}`
                      : `${u.firstName ?? ""} ${u.lastName ?? ""}`}
                  </p>
                  <p className="text-xs text-gray-500">{u.parentData?.email || u.email}</p>
                  <p className="text-xs text-gray-400">Status: {u.status}</p>
                </div>

                {/* Payment history (students only) */}
                {"learnerData" in u && payments[u.id] && (
                  <div className="bg-white border rounded p-2 text-xs">
                    <p className="font-semibold mb-1">Payment History:</p>
                    {payments[u.id].length === 0 ? (
                      <p className="text-gray-400">No payments yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {payments[u.id].map((p) => (
                          <li key={p.id} className="flex justify-between">
                            <span
                              className={
                                p.paymentStatus === "COMPLETE"
                                  ? "text-green-600"
                                  : "text-red-600 font-semibold"
                              }
                            >
                              R{p.amount} — {p.paymentStatus}
                            </span>
                            <span className="text-gray-400">
                              {new Date(p.processedAt.toDate()).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Actions */}
                {u.status === "pending_review" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(u, col)}
                    >
                      Review Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approve(col, u.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(col, u.id)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : u.status === "suspended" ? (
                  <Button
                    size="sm"
                    onClick={() => reinstate(col, u.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Reinstate
                  </Button>
                ) : (
                  <div className="flex gap-2">
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
                      onClick={() =>
                        freezeClass(col, u.id, u.classActivated === false)
                      }
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

  const renderParents = () => {
    const filtered = parents.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>Parents</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 && <p className="text-sm text-gray-500">No parents found.</p>}
          <ul className="space-y-3">
            {filtered.map((p) => (
              <li key={p.id} className="p-3 border rounded bg-gray-50">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.email}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(p, "parents")}
                  className="mt-2"
                >
                  Review Details
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // ---------------- Layout ----------------
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCard("Students", students, "registrations")}
        {renderCard("Teachers", teachers, "teacherApplications")}
        {renderParents()}
      </div>

      {/* ✅ Universal Review Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={closeModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Review {selectedType === "teacherApplications"
                ? "Teacher Application"
                : selectedType === "registrations"
                ? "Student Registration"
                : "Parent Record"}
            </h2>

            {/* Display all object fields */}
            <div className="space-y-3 text-sm">
              {Object.entries(selectedItem).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong>{" "}
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </p>
              ))}
            </div>

            {/* Approve/Reject buttons only for Teachers and Students */}
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
