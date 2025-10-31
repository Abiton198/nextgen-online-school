"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";

/* ===========================================================
   INTERFACES
   =========================================================== */
interface Message {
  id: string;
  sender: string;
  recipient: string;
  text: string;
  createdAt: any;
}

interface ChatWidgetProps {
  role: "parent" | "teacher" | "principal";
  uid: string;
  initialRecipient?: string;     // e.g., parent opens chat with teacher
  subject?: string;              // for teacher-parent subject-specific chat
  forceOpen?: boolean;
  onClose?: () => void;
}

/* ===========================================================
   CHAT WIDGET
   =========================================================== */
export default function ChatWidget({
  role,
  uid,
  initialRecipient,
  subject,
  forceOpen,
  onClose,
}: ChatWidgetProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [recipient, setRecipient] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("Recipient");
  const [recipientPhoto, setRecipientPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const typingTimeout = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* ──────────────────────────────────────────────────────
     AUTO-SCROLL TO BOTTOM
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ──────────────────────────────────────────────────────
     DETERMINE RECIPIENT (Principal, Teacher, Parent)
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    const initRecipient = async () => {
      if (initialRecipient) {
        setRecipient(initialRecipient);
        return;
      }

      try {
        if (role === "parent") {
          // Parent → Principal
          const principalSnap = await getDocs(
            query(collection(db, "principals"), where("active", "==", true))
          );
          if (!principalSnap.empty) {
            setRecipient(principalSnap.docs[0].id);
          }
        } else if (role === "teacher" || role === "principal") {
          // Teacher/Principal → Find parent via subject enrollment
          if (subject) {
            const studentsSnap = await getDocs(
              query(
                collection(db, "students"),
                where("subjects", "array-contains", subject)
              )
            );
            if (!studentsSnap.empty) {
              const parentId = studentsSnap.docs[0].data().parentId;
              setRecipient(parentId);
            }
          }
        }
      } catch (err) {
        console.error("Error finding recipient:", err);
      } finally {
        setLoading(false);
      }
    };

    initRecipient();
  }, [role, initialRecipient, subject]);

  /* ──────────────────────────────────────────────────────
     BUILD CONVERSATION ID (sorted for consistency)
     ────────────────────────────────────────────────────── */
  const conversationId =
    uid && recipient ? [uid, recipient].sort().join("_") : null;

  /* ──────────────────────────────────────────────────────
     FETCH RECIPIENT INFO (Name + Photo)
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!recipient) return;

    const fetchRecipientInfo = async () => {
      const collections = ["parents", "teachers", "principals"];
      for (const col of collections) {
        const ref = doc(db, col, recipient);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setRecipientName(data.name || data.fullName || "User");
          setRecipientPhoto(data.photoURL || null);
          return;
        }
      }
      setRecipientName("User");
    };

    fetchRecipientInfo();
  }, [recipient]);

  /* ──────────────────────────────────────────────────────
     SUBSCRIBE TO MESSAGES (Real-Time)
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    }, (err) => {
      console.error("Message listen failed:", err);
    });

    return () => unsub();
  }, [conversationId]);

  /* ──────────────────────────────────────────────────────
     TYPING INDICATOR (Real-Time)
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!conversationId || !recipient) return;

    const typingRef = doc(db, "conversations", conversationId, "typing", recipient);
    const unsub = onSnapshot(typingRef, (snap) => {
      const data = snap.data();
      setIsRecipientTyping(data?.isTyping === true);
    });

    return () => unsub();
  }, [conversationId, recipient]);

  /* ──────────────────────────────────────────────────────
     UPDATE TYPING STATUS
     ────────────────────────────────────────────────────── */
  const updateTyping = async (isTyping: boolean) => {
    if (!conversationId) return;
    await setDoc(
      doc(db, "conversations", conversationId, "typing", uid),
      { isTyping, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const handleTyping = (val: string) => {
    setMessage(val);
    if (!typingTimeout.current) updateTyping(true);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      updateTyping(false);
      typingTimeout.current = null;
    }, 1500);
  };

  /* ──────────────────────────────────────────────────────
     SEND MESSAGE (with metadata)
     ────────────────────────────────────────────────────── */
  const sendMessage = async () => {
    if (!conversationId || !message.trim() || !recipient) return;

    const convRef = doc(db, "conversations", conversationId);

    try {
      // Ensure conversation exists
      await setDoc(
        convRef,
        {
          participants: [uid, recipient],
          subject: subject || null,
          lastMessage: message,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Add message
      await addDoc(collection(convRef, "messages"), {
        sender: uid,
        recipient,
        text: message.trim(),
        createdAt: serverTimestamp(),
      });

      setMessage("");
      updateTyping(false);
    } catch (err) {
      console.error("Send failed:", err);
      alert("Failed to send message.");
    }
  };

  /* ──────────────────────────────────────────────────────
     FORCE OPEN
     ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (forceOpen) setChatOpen(true);
  }, [forceOpen]);

  const toggleChat = () => {
    const newState = !chatOpen;
    setChatOpen(newState);
    if (!newState && onClose) onClose();
  };

  /* ──────────────────────────────────────────────────────
     LOADING STATE
     ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed bottom-6 right-6">
        <button className="bg-gray-400 text-white rounded-full p-4 shadow-lg animate-pulse">
          Loading...
        </button>
      </div>
    );
  }

  /* ===========================================================
     UI RENDER
     =========================================================== */
  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full p-4 shadow-xl hover:from-green-600 hover:to-emerald-700 transition transform hover:scale-110"
        >
          Chat
        </button>
      </div>

      {/* Chat Window */}
      {chatOpen && conversationId && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                  {recipientName[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{recipientName}</p>
                {subject && <p className="text-xs opacity-90">{subject}</p>}
              </div>
            </div>
            <button onClick={toggleChat} className="text-white hover:opacity-70">
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-xs">Start the conversation!</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === uid ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      m.sender === uid
                        ? "bg-blue-600 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    {m.text}
                    {m.createdAt && (
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(m.createdAt.toDate()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {isRecipientTyping && (
            <p className="text-xs text-green-600 px-3 py-1 italic">
              {recipientName} is typing...
            </p>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t bg-white">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}