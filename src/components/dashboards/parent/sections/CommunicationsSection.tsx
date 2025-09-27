"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, ChevronRight } from "lucide-react";

interface Conversation {
  id: string;
  label: string;
  type: "principal" | "admin" | "teacher";
  subject?: string;
}

export default function CommunicationsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState("");
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // 📌 List of conversations (stacked items)
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "principal", label: "👨‍🏫 Principal", type: "principal" },
    { id: "admin", label: "🏫 Admin", type: "admin" },
    { id: "teacher_Maths", label: "🎓 Maths Teacher", type: "teacher", subject: "Maths" },
    { id: "teacher_English", label: "🎓 English Teacher", type: "teacher", subject: "English" },
    { id: "teacher_Science", label: "🎓 Natural Science Teacher", type: "teacher", subject: "Natural Science" },
     { id: "teacher_Physics", label: "🎓 Physics Teacher", type: "teacher", subject: "Physics" },
          { id: "teacher_AI ", label: "🎓 AI Teacher ", type: "teacher", subject: "AI " },
                    { id: "teacher_CAT ", label: "🎓 CAT Teacher ", type: "teacher", subject: "CAT " },
                              { id: "teacher_Life Sciences ", label: "🎓 Life Science Teacher ", type: "teacher", subject: "Life Science " },
  ]);

  // 📥 Load messages for each conversation
  useEffect(() => {
    if (!user) return;

    const unsubscribes = conversations.map((conv) => {
      const q = query(
        collection(db, "messages"),
        where("parentId", "==", user.uid),
        where("conversationId", "==", conv.id),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snap) => {
        setMessages((prev) => ({
          ...prev,
          [conv.id]: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, conversations]);

  // 📥 Load announcements
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(list);
    });
    return () => unsubscribe();
  }, []);

  // 📤 Send message
  const sendMessage = async (conv: Conversation) => {
    if (!newMessage.trim() || !user?.uid) return;

    await addDoc(collection(db, "messages"), {
      parentId: user.uid,
      conversationId: conv.id,
      sender: user.uid,
      recipient: conv.id,
      subject: conv.subject || null,
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 🔝 Floating Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-2 py-2 mb-4">
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

      {/* 📌 Stacked Conversations */}
      <div className="space-y-3">
        {conversations.map((conv) => {
          const convMessages = messages[conv.id] || [];
          const isActive = activeConv === conv.id;

          return (
            <div
              key={conv.id}
              className="border rounded-lg bg-white shadow-md overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setActiveConv(isActive ? null : conv.id)
                }
                className="w-full flex justify-between items-center px-4 py-2 bg-blue-100 hover:bg-blue-200"
              >
                <span className="font-semibold text-gray-800">
                  {conv.label}
                </span>
                {isActive ? <ChevronDown /> : <ChevronRight />}
              </button>

              {/* Expanded Chat */}
              {isActive && (
                <div className="p-4 space-y-3">
                  {/* Messages */}
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                    {convMessages.length > 0 ? (
                      convMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span
                            className={
                              msg.sender === user?.uid
                                ? "font-medium text-blue-600"
                                : "font-medium text-gray-700"
                            }
                          >
                            {msg.sender === user?.uid ? "You" : msg.sender}:
                          </span>{" "}
                          {msg.text}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        No messages yet. Any technical issues? Call helpdesk at
                        (+27)65 656 4983
                      </p>
                    )}
                  </div>

                  {/* Chatbox */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Message ${conv.label}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 border rounded p-1 text-sm"
                    />
                    <button
                      onClick={() => sendMessage(conv)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🏫 Announcements */}
      <div className="bg-green-50 border border-green-300 rounded-xl p-4 shadow-md">
        <h2 className="text-lg font-semibold text-green-800 mb-3">
          🏫 School Announcements
        </h2>

        <div className="space-y-2">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="bg-white rounded p-2 border">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-gray-700">{a.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              Any technical issues? Call helpdesk at (+27)65 656 4983
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
