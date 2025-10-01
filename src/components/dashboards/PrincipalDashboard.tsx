"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, doc, onSnapshot } from "firebase/firestore";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { approveTeacher, rejectTeacher } from "@/lib/teacherActions";
import { approveStudent, rejectStudent } from "@/lib/studentActions";
import { suspendUser, reinstateUser } from "@/lib/userActions";
import { sendMessage, subscribeToMessages, Message } from "@/lib/chatActions";

interface Reference {
  name: string;
  contact: string;
}

interface UserRecord {
  uid: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  subject?: string;
  parentId?: string;
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

  const principalUid = auth.currentUser?.uid || "";

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

  // 🔹 Subscribe to messages
  useEffect(() => {
    if (!principalUid) return;
    const unsub = subscribeToMessages(principalUid, chatTo, setMessages);
    return () => unsub();
  }, [principalUid, chatTo]);

  // ---------------- Handlers ----------------
  const handleApproveTeacher = async (teacher: UserRecord) => {
    try {
      await approveTeacher(teacher, principalUid);
    } catch (err) {
      console.error("Teacher approval failed:", err);
    }
  };

  const handleRejectTeacher = async (teacher: UserRecord) => {
    try {
      await rejectTeacher(teacher, principalUid);
    } catch (err) {
      console.error("Teacher rejection failed:", err);
    }
  };

  const handleApproveStudent = async (student: UserRecord) => {
    try {
      await approveStudent(student, principalUid);
    } catch (err) {
      console.error("Student approval failed:", err);
    }
  };

  const handleRejectStudent = async (student: UserRecord) => {
    try {
      await rejectStudent(student, principalUid);
    } catch (err) {
      console.error("Student rejection failed:", err);
    }
  };

  const handleSendMessage = async () => {
    try {
      await sendMessage(principalUid, chatTo, message);
      setMessage("");
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  // ---------------- Render Helper ----------------
  const renderUserCard = (
    title: string,
    users: UserRecord[],
    onApprove?: (u: UserRecord) => void,
    onReject?: (u: UserRecord) => void,
    allowSuspend?: boolean,
    allowReinstate?: boolean
  ) => {
    const filteredUsers = users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                  <p className="text-xs text-gray-400">Status: {u.status}</p>
                </div>

                {/* Actions */}
                {onApprove && onReject ? (
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
        {renderUserCard(
          "Pending Students",
          pendingStudents,
          handleApproveStudent,
          handleRejectStudent
        )}
        {renderUserCard(
          "Pending Teachers",
          pendingTeachers,
          handleApproveTeacher,
          handleRejectTeacher
        )}

        {renderUserCard("Approved Students", approvedStudents, undefined, undefined, true)}
        {renderUserCard("Approved Teachers", approvedTeachers, undefined, undefined, true)}

        {renderUserCard("Suspended Students", suspendedStudents, undefined, undefined, false, true)}
        {renderUserCard("Suspended Teachers", suspendedTeachers, undefined, undefined, false, true)}
      </div>

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
              <option key={s.uid} value={s.parentId || s.uid}>
                Parent of: {s.name || s.email}
              </option>
            ))}
          </select>

          <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
            {messages.length > 0 ? (
              messages.map((m) => (
                <div key={m.id} className="text-xs mb-1">
                  <span
                    className={
                      m.sender === principalUid
                        ? "font-medium text-blue-600"
                        : "font-medium text-gray-700"
                    }
                  >
                    {m.sender === principalUid ? "You" : m.sender}:
                  </span>{" "}
                  {m.text}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No messages yet.</p>
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
              onClick={handleSendMessage}
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
