"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Reference {
  name: string;
  contact: string;
}

interface UserRecord {
  uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  subject?: string;
  status?: string;

  gender?: string;
  province?: string;
  country?: string;
  address?: string;
  contact?: string;
  experience?: string;
  previousSchool?: string;
  references?: Reference[];

  idUrl?: string;
  qualUrl?: string;
  photoUrl?: string;
  cetaUrl?: string;
  workPermitUrl?: string;

  applicationStage?: string;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  text: string;
  createdAt: any;
}

const PrincipalDashboard: React.FC = () => {
  const [pendingStudents, setPendingStudents] = useState<UserRecord[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<UserRecord[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<UserRecord[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<UserRecord[]>([]);
  const [suspendedStudents, setSuspendedStudents] = useState<UserRecord[]>([]);
  const [suspendedTeachers, setSuspendedTeachers] = useState<UserRecord[]>([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTo, setChatTo] = useState<string>("helpdesk");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [reviewTeacher, setReviewTeacher] = useState<UserRecord | null>(null);

  const principalUid = auth.currentUser?.uid || "principal";

  // ---------------- Realtime Listeners ----------------
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      onSnapshot(collection(db, "pendingStudents"), (snap) =>
        setPendingStudents(
          snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserRecord))
        )
      )
    );

    unsubscribers.push(
      onSnapshot(collection(db, "pendingTeachers"), (snap) =>
        setPendingTeachers(
          snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserRecord))
        )
      )
    );

    unsubscribers.push(
      onSnapshot(collection(db, "students"), (snap) => {
        const all = snap.docs.map(
          (d) => ({ uid: d.id, ...d.data() } as UserRecord)
        );
        setApprovedStudents(all.filter((s) => s.status !== "suspended"));
        setSuspendedStudents(all.filter((s) => s.status === "suspended"));
      })
    );

    unsubscribers.push(
      onSnapshot(collection(db, "teachers"), (snap) => {
        const all = snap.docs.map(
          (d) => ({ uid: d.id, ...d.data() } as UserRecord)
        );
        setApprovedTeachers(all.filter((t) => t.status !== "suspended"));
        setSuspendedTeachers(all.filter((t) => t.status === "suspended"));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  // 🔹 Load chat messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Message)
      );
      setMessages(
        msgs.filter(
          (m) =>
            m.sender === principalUid ||
            m.recipient === principalUid ||
            m.sender === chatTo ||
            m.recipient === chatTo
        )
      );
    });
    return () => unsub();
  }, [principalUid, chatTo]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    await addDoc(collection(db, "messages"), {
      sender: principalUid,
      recipient: chatTo,
      text: message,
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };

  // ---------------- Approve / Reject Logic ----------------
  const approveTeacher = async (teacher: UserRecord) => {
    await setDoc(doc(db, "teachers", teacher.uid), {
      ...teacher,
      role: "teacher",
      status: "approved",
      applicationStage: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: principalUid,
    });
    await deleteDoc(doc(db, "pendingTeachers", teacher.uid));
    setReviewTeacher(null);
  };

  const rejectTeacher = async (teacher: UserRecord) => {
    await updateDoc(doc(db, "pendingTeachers", teacher.uid), {
      applicationStage: "rejected",
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: principalUid,
    });
    setReviewTeacher(null);
  };

  const startReview = async (teacher: UserRecord) => {
    setReviewTeacher(teacher);
    if (teacher.applicationStage !== "under-review") {
      await updateDoc(doc(db, "pendingTeachers", teacher.uid), {
        applicationStage: "under-review",
        reviewedAt: new Date().toISOString(),
        reviewedBy: principalUid,
      });
    }
  };

  const approveStudent = async (student: UserRecord) => {
    await setDoc(doc(db, "students", student.uid), {
      ...student,
      role: "student",
      status: "approved",
      applicationStage: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: principalUid,
    });
    await deleteDoc(doc(db, "pendingStudents", student.uid));
  };

  const rejectStudent = async (student: UserRecord) => {
    await updateDoc(doc(db, "pendingStudents", student.uid), {
      applicationStage: "rejected",
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: principalUid,
    });
  };

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
    allowReinstate?: boolean,
    isTeacherList?: boolean
  ) => {
    const filteredUsers = users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500">No matching records found.</p>
          )}
          <ul className="space-y-3">
            {filteredUsers.map((u) => (
              <li
                key={u.uid}
                className="p-3 border rounded-md bg-gray-50 flex flex-col gap-2"
              >
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    Status: {u.applicationStage || u.status}
                  </p>
                </div>

                {/* 🔹 Teacher docs quick links */}
                {u.role === "teacher" && (
                  <div className="flex flex-col gap-1 text-xs">
                    {u.idUrl && <a href={u.idUrl} target="_blank">📄 ID</a>}
                    {u.qualUrl && <a href={u.qualUrl} target="_blank">🎓 Qualifications</a>}
                    {u.photoUrl && <a href={u.photoUrl} target="_blank">🖼 Photo</a>}
                  </div>
                )}

                {/* Actions */}
                {isTeacherList && onApprove && onReject ? (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => startReview(u)}
                    >
                      Review
                    </Button>
                  </div>
                ) : onApprove && onReject ? (
                  <div className="flex gap-2 mt-2">
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
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => suspendUser(u)}
                  >
                    Suspend
                  </Button>
                ) : allowReinstate ? (
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
  };

  // ---------------- Dashboard Layout ----------------
  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Principal Dashboard
      </h1>

      {/* 🔍 Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderUserCard("Pending Students", pendingStudents, approveStudent, rejectStudent)}
        {renderUserCard("Pending Teachers", pendingTeachers, approveTeacher, rejectTeacher, false, false, true)}

        {renderUserCard("Approved Students", approvedStudents, undefined, undefined, true)}
        {renderUserCard("Approved Teachers", approvedTeachers, undefined, undefined, true)}

        {renderUserCard("Suspended Students", suspendedStudents, undefined, undefined, false, true)}
        {renderUserCard("Suspended Teachers", suspendedTeachers, undefined, undefined, false, true)}
      </div>

      {/* 🔎 Teacher Review Modal */}
      {reviewTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">
              Reviewing {reviewTeacher.firstName} {reviewTeacher.lastName}
            </h2>

            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {reviewTeacher.email}</p>
              <p><strong>Gender:</strong> {reviewTeacher.gender}</p>
              <p><strong>Contact:</strong> {reviewTeacher.contact}</p>
              <p><strong>Address:</strong> {reviewTeacher.address}</p>
              <p><strong>Province:</strong> {reviewTeacher.province}</p>
              <p><strong>Country:</strong> {reviewTeacher.country}</p>
              <p><strong>Experience:</strong> {reviewTeacher.experience}</p>
              <p><strong>Previous School:</strong> {reviewTeacher.previousSchool}</p>
              <p><strong>Subject:</strong> {reviewTeacher.subject}</p>
              {reviewTeacher.references && (
                <div>
                  <strong>References:</strong>
                  <ul className="list-disc pl-6">
                    {reviewTeacher.references.map((r, idx) => (
                      <li key={idx}>{r.name} ({r.contact})</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-1 mt-2">
                {reviewTeacher.idUrl && <a href={reviewTeacher.idUrl} target="_blank">📄 View ID</a>}
                {reviewTeacher.qualUrl && <a href={reviewTeacher.qualUrl} target="_blank">🎓 View Qualifications</a>}
                {reviewTeacher.photoUrl && <a href={reviewTeacher.photoUrl} target="_blank">🖼 View Photo</a>}
                {reviewTeacher.cetaUrl && <a href={reviewTeacher.cetaUrl} target="_blank">📝 View CETA Certificate</a>}
                {reviewTeacher.workPermitUrl && <a href={reviewTeacher.workPermitUrl} target="_blank">🌍 View Work Permit</a>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approveTeacher(reviewTeacher)}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectTeacher(reviewTeacher)}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setReviewTeacher(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 Floating Chat */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
        >
          💬
        </button>
      </div>

      {/* Chatbox */}
      {chatOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border rounded-lg shadow-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Send a Message</h2>

          <select
            value={chatTo}
            onChange={(e) => setChatTo(e.target.value)}
            className="w-full border rounded p-1 mb-2 text-sm"
          >
            <option value="helpdesk">Helpdesk</option>
            {approvedTeachers.map((t) => (
              <option key={t.uid} value={t.uid}>
                Teacher: {t.firstName} {t.lastName}
              </option>
            ))}
            {approvedStudents.map((s) => (
              <option key={s.uid} value={s.uid}>
                Student: {s.firstName} {s.lastName}
              </option>
            ))}
          </select>

          <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2 text-xs">
            {messages.length > 0 ? (
              messages.map((m) => (
                <div key={m.id} className="mb-1">
                  <span className={m.sender === principalUid ? "font-medium text-blue-600" : "font-medium text-gray-700"}>
                    {m.sender === principalUid ? "You" : m.sender}:
                  </span>{" "}
                  {m.text}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No messages yet.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border rounded p-1 text-sm"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
