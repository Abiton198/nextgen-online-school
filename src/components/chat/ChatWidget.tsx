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
} from "firebase/firestore";

/* ----------------- Interfaces ----------------- */
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
  initialRecipient?: string;
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
  const typingTimeout = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* 🔹 Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 🔹 Determine the conversation partner */
  useEffect(() => {
    const initRecipient = async () => {
      if (initialRecipient) {
        // If we already have one (e.g., principal opens chat with parent)
        setRecipient(initialRecipient);
        return;
      }

      if (role === "parent") {
        // 👇 Find the principal UID dynamically
        try {
          const principalSnap = await getDocs(collection(db, "principals"));
          if (!principalSnap.empty) {
            setRecipient(principalSnap.docs[0].id); // first principal’s UID
          } else {
            console.warn("No principal found in Firestore");
          }
        } catch (err) {
          console.error("Error fetching principal UID:", err);
        }
      }
    };
    initRecipient();
  }, [role, initialRecipient]);

  /* 🔹 Build conversation ID once both IDs are known */
  const conversationId =
    recipient && uid ? [uid, recipient].sort().join("_") : null;

  /* 🔹 Fetch recipient info (name/photo) */
  useEffect(() => {
    if (!recipient) return;
    const fetchRecipientInfo = async () => {
      try {
        // Try looking up in parents, teachers, or principals
        const collectionsToTry = ["parents", "teachers", "principals"];
        for (const col of collectionsToTry) {
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
        setRecipientPhoto(null);
      } catch (err) {
        console.error("Error fetching recipient info:", err);
        setRecipientName("User");
      }
    };
    fetchRecipientInfo();
  }, [recipient]);

  /* 🔹 Subscribe to messages */
  useEffect(() => {
    if (!conversationId) return;
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    });
    return () => unsub();
  }, [conversationId]);

  /* 🔹 Subscribe to typing state */
  useEffect(() => {
    if (!conversationId || !recipient) return;
    const ref = doc(db, "conversations", conversationId, "typing", recipient);
    const unsub = onSnapshot(ref, (snap) => {
      setIsRecipientTyping(snap.exists() && snap.data().isTyping);
    });
    return () => unsub();
  }, [conversationId, recipient]);

  /* 🔹 Update typing status */
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
    if (!typingTimeout.current) {
      updateTyping(true);
    } else {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      updateTyping(false);
      typingTimeout.current = null;
    }, 2000);
  };

  /* 🔹 Send message */
 const sendMessage = async () => {
  if (!conversationId || !message.trim()) return;

  const conversationRef = doc(db, "conversations", conversationId);

  // ✅ Make sure the conversation exists first
  await setDoc(
    conversationRef,
    {
      participants: [uid, recipient],
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // ✅ Add the message
  await addDoc(collection(conversationRef, "messages"), {
    sender: uid,
    recipient,
    text: message,
    createdAt: serverTimestamp(),
  });

  // ✅ Update metadata
  await setDoc(
    conversationRef,
    {
      lastMessage: message,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  setMessage("");
  await updateTyping(false);
};


  /* 🔹 Force chat open if required */
  useEffect(() => {
    if (forceOpen) setChatOpen(true);
  }, [forceOpen]);

  const toggleChat = () => {
    const newState = !chatOpen;
    setChatOpen(newState);
    if (!newState && onClose) onClose();
  };

  /* ===========================================================
     UI
     =========================================================== */
  return (
    <>
      <div className="fixed bottom-6 right-6">
        <button
          onClick={toggleChat}
          className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700"
        >
          💬
        </button>
      </div>

      {chatOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border rounded-lg shadow-lg">
          {/* ✅ Header */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              {recipientPhoto ? (
                <img
                  src={recipientPhoto}
                  alt={recipientName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300" />
              )}
              <span className="text-sm font-semibold">
                {recipientName || "Recipient"}
              </span>
            </div>
            <button
              className="text-gray-400 hover:text-black text-sm"
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          {/* ✅ Messages */}
          <div className="max-h-60 overflow-y-auto p-2 text-xs">
            {messages.length > 0 ? (
              messages.map((m) => (
                <div key={m.id} className="mb-1">
                  <span
                    className={`font-medium ${
                      m.sender === uid ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {m.sender === uid ? "You" : recipientName}:
                  </span>{" "}
                  {m.text}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No messages yet.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Typing Indicator */}
          {isRecipientTyping && (
            <p className="text-xs text-green-600 px-2 mb-1">
              ✍️ {recipientName} is typing…
            </p>
          )}

          {/* ✅ Input */}
          <div className="flex gap-2 p-2 border-t">
            <input
              type="text"
              placeholder="Type message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              className="flex-1 border rounded p-1 text-sm"
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
