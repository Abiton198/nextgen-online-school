import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserRecord {
  uid: string;
  name: string;
  email: string;
  role: string;
  subject?: string;
  parentId?: string;
  status?: string;
}

const PrincipalDashboard: React.FC = () => {
  const [pendingStudents, setPendingStudents] = useState<UserRecord[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<UserRecord[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<UserRecord[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<UserRecord[]>([]);
  const [suspendedStudents, setSuspendedStudents] = useState<UserRecord[]>([]);
  const [suspendedTeachers, setSuspendedTeachers] = useState<UserRecord[]>([]);

  // ---------------- Realtime Listeners ----------------
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      onSnapshot(collection(db, "pendingStudents"), (snap) =>
        setPendingStudents(snap.docs.map((d) => d.data() as UserRecord))
      )
    );

    unsubscribers.push(
      onSnapshot(collection(db, "pendingTeachers"), (snap) =>
        setPendingTeachers(snap.docs.map((d) => d.data() as UserRecord))
      )
    );

    unsubscribers.push(
      onSnapshot(collection(db, "students"), (snap) => {
        const all = snap.docs.map((d) => d.data() as UserRecord);
        setApprovedStudents(all.filter((s) => s.status !== "suspended"));
        setSuspendedStudents(all.filter((s) => s.status === "suspended"));
      })
    );

    unsubscribers.push(
      onSnapshot(collection(db, "teachers"), (snap) => {
        const all = snap.docs.map((d) => d.data() as UserRecord);
        setApprovedTeachers(all.filter((t) => t.status !== "suspended"));
        setSuspendedTeachers(all.filter((t) => t.status === "suspended"));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  // ---------------- Approve / Reject Logic ----------------
  const approveStudent = async (student: UserRecord) => {
    const principalUid = auth.currentUser?.uid;

    await setDoc(doc(db, "students", student.uid), {
      ...student,
      role: "student",
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: principalUid || "system",
    });
    await deleteDoc(doc(db, "pendingStudents", student.uid));
  };

  const rejectStudent = async (student: UserRecord) => {
    await deleteDoc(doc(db, "pendingStudents", student.uid));
  };

  const approveTeacher = async (teacher: UserRecord) => {
    const principalUid = auth.currentUser?.uid;

    await setDoc(doc(db, "teachers", teacher.uid), {
      ...teacher,
      role: "teacher",
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: principalUid || "system",
    });
    await deleteDoc(doc(db, "pendingTeachers", teacher.uid));
  };

  const rejectTeacher = async (teacher: UserRecord) => {
    await deleteDoc(doc(db, "pendingTeachers", teacher.uid));
  };

  // ---------------- Suspend / Reinstate Logic ----------------
  const suspendUser = async (user: UserRecord) => {
    const collectionName = user.role === "teacher" ? "teachers" : "students";
    await setDoc(
      doc(db, collectionName, user.uid),
      { status: "suspended", suspendedAt: new Date().toISOString() },
      { merge: true }
    );
  };

  const reinstateUser = async (user: UserRecord) => {
    const collectionName = user.role === "teacher" ? "teachers" : "students";
    await setDoc(
      doc(db, collectionName, user.uid),
      { status: "approved", reinstatedAt: new Date().toISOString() },
      { merge: true }
    );
  };

  // ---------------- Render Helper ----------------
  const renderUserCard = (
    title: string,
    users: UserRecord[],
    onApprove?: (u: UserRecord) => void,
    onReject?: (u: UserRecord) => void,
    allowSuspend?: boolean,
    allowReinstate?: boolean
  ) => (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 && (
          <p className="text-sm text-gray-500">No records found.</p>
        )}
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.uid}
              className="flex justify-between items-center p-2 border rounded-md"
            >
              <div>
                <p className="font-medium">{u.name || u.email}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
                {u.role === "teacher" && u.subject && (
                  <p className="text-xs text-gray-400">
                    Subject: {u.subject}
                  </p>
                )}
                <p className="text-xs text-gray-400">Status: {u.status}</p>
              </div>

              {/* Buttons */}
              {onApprove && onReject ? (
                // Pending → Approve/Reject
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onApprove(u)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(u)}
                  >
                    Reject
                  </Button>
                </div>
              ) : allowSuspend ? (
                // Approved → Suspend
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600"
                  onClick={() => suspendUser(u)}
                >
                  Suspend
                </Button>
              ) : allowReinstate ? (
                // Suspended → Reinstate
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => reinstateUser(u)}
                >
                  Reinstate
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  // ---------------- Dashboard Layout ----------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Principal Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending */}
        {renderUserCard(
          "Pending Students",
          pendingStudents,
          approveStudent,
          rejectStudent
        )}
        {renderUserCard(
          "Pending Teachers",
          pendingTeachers,
          approveTeacher,
          rejectTeacher
        )}

        {/* Approved */}
        {renderUserCard("Approved Students", approvedStudents, undefined, undefined, true)}
        {renderUserCard("Approved Teachers", approvedTeachers, undefined, undefined, true)}

        {/* Suspended */}
        {renderUserCard("Suspended Students", suspendedStudents, undefined, undefined, false, true)}
        {renderUserCard("Suspended Teachers", suspendedTeachers, undefined, undefined, false, true)}
      </div>
    </div>
  );
};

export default PrincipalDashboard;
