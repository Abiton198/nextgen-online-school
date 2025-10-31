"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, ChevronRight, MessageCircle, School, User } from "lucide-react";

interface Student {
  id: string;
  subjects: string[];
  curriculum: "CAPS" | "Cambridge";
}

interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  label: string;
  type: "principal" | "admin" | "teacher";
  subject?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export default function CommunicationsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ──────────────────────────────────────────────────────────
  // FETCH ENROLLED STUDENTS & BUILD CONVERSATIONS
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchStudents = async () => {
      try {
        // Fetch all students for this parent
        let q = query(collection(db, "students"), where("parentId", "==", user.uid));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(collection(db, "students"), where("linkedParentId", "==", user.uid));
          snap = await getDocs(q);
        }

        if (snap.empty) {
          q = query(collection(db, "students"), where("linkedParentEmail", "==", user.email));
          snap = await getDocs(q);
        }

        const studentList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        setStudents(studentList);

        // Extract unique subjects
        const allSubjects = new Set<string>();
        studentList.forEach((s) => s.subjects?.forEach((sub) => allSubjects.add(sub)));

        // Build dynamic conversation list
        const dynamicConvs: Conversation[] = [
          { id: "principal", label: "Principal", type: "principal" },
          { id: "admin", label: "Admin", type: "admin" },
        ];

        allSubjects.forEach((subject) => {
          dynamicConvs.push({
            id: `teacher_${subject}`,
            label: `${subject} Teacher`,
            type: "teacher",
            subject,
          });
        });

        setConversations(dynamicConvs);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.uid, user?.email]);

  // ──────────────────────────────────────────────────────────
  // REAL-TIME MESSAGES PER CONVERSATION
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || conversations.length === 0) return;

    const unsubscribes = conversations.map((conv) => {
      const q = query(
        collection(db, "messages"),
        where("parentId", "==", user.uid),
        where("conversationId", "==", conv.id),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snap) => {
        const msgList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
        setMessages((prev) => ({
          ...prev,
          [conv.id]: msgList,
        }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user?.uid, conversations]);

  // ──────────────────────────────────────────────────────────
  // REAL-TIME ANNOUNCEMENTS
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(list);
    });
    return () => unsubscribe();
  }, []);

  // ──────────────────────────────────────────────────────────
  // SEND MESSAGE
  // ──────────────────────────────────────────────────────────
  const sendMessage = async (conv: Conversation) => {
    if (!newMessage.trim() || !user?.uid) return;

    try {
      await addDoc(collection(db, "messages"), {
        parentId: user.uid,
        conversationId: conv.id,
        sender: user.uid,
        recipient: conv.type === "teacher" ? `teacher_${conv.subject}` : conv.id,
        subject: conv.subject || null,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Try again.");
    }
  };

  // ──────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading your conversations...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">

      {/* Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-2 py-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => navigate("/parent-dashboard")}
          className="text-gray-600 hover:text-red-600"
        >
          <X size={20} />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 text-center">
        Communications Hub
      </h1>

      {/* Dynamic Conversations */}
      <div className="space-y-3">
        {conversations.length === 0 ? (
          <p className="text-center text-gray-500">
            No enrolled subjects. Register a student to start communicating.
          </p>
        ) : (
          conversations.map((conv) => {
            const convMessages = messages[conv.id] || [];
            const isActive = activeConv === conv.id;

            return (
              <div
                key={conv.id}
                className="border rounded-lg bg-white shadow-sm overflow-hidden transition-all"
              >
                {/* Header */}
                <button
                  onClick={() => setActiveConv(isActive ? null : conv.id)}
                  className="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {conv.type === "principal" && <School className="w-5 h-5 text-indigo-600" />}
                    {conv.type === "admin" && <User className="w-5 h-5 text-green-600" />}
                    {conv.type === "teacher" && <MessageCircle className="w-5 h-5 text-purple-600" />}
                    <span className="font-semibold text-gray-800">{conv.label}</span>
                  </div>
                  {isActive ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {/* Chat Panel */}
                {isActive && (
                  <div className="p-4 space-y-3 border-t">
                    {/* Messages */}
                    <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded border">
                      {convMessages.length > 0 ? (
                        convMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`text-sm p-2 rounded-lg max-w-xs ${
                              msg.sender === user?.uid
                                ? "bg-blue-100 text-blue-900 ml-auto"
                                : "bg-white border text-gray-800"
                            }`}
                          >
                            <p className="font-medium">
                              {msg.sender === user?.uid ? "You" : conv.label.split(" ")[0]}:
                            </p>
                            <p>{msg.text}</p>
                            {msg.createdAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(msg.createdAt.toDate()).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center">
                          Start the conversation!
                        </p>
                      )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Message ${conv.label}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage(conv)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => sendMessage(conv)}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Announcements */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-md">
        <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
          <School className="w-5 h-5" /> School Announcements
        </h2>

        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg p-3 border shadow-sm"
              >
                <p className="font-semibold text-gray-800">{a.title}</p>
                <p className="text-sm text-gray-700 mt-1">{a.content}</p>
                {a.createdAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(a.createdAt.toDate()).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">
              No announcements at this time.
            </p>
          )}
        </div>
      </div>

      {/* Help */}
      <p className="text-center text-xs text-gray-500 mt-6">
        Need help? Call support: <strong>(+27) 65 656 4983</strong>
      </p>
    </div>
  );
}