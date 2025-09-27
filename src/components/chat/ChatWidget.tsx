"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  text: string;
  createdAt: any;
}

interface ChatWidgetProps {
  role: "parent" | "teacher" | "principal";
  uid: string; // logged in user UID
}

export default function ChatWidget({ role, uid }: ChatWidgetProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [recipient, setRecipient] = useState("principal"); // default target
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // 🔹 Subscribe to messages for this user
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs.filter((m) => m.recipient === uid || m.sender === uid));
    });
    return () => unsub();
  }, [uid]);

  // 🔹 Send new message
  const sendMessage = async () => {
    if (!message.trim()) return;
    await addDoc(collection(db, "messages"), {
      sender: uid,
      recipient,
      text: message,
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };

  return (
    <>
      {/* Floating Icon */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700"
        >
          💬
        </button>
      </div>

      {/* Chatbox */}
      {chatOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border rounded-lg shadow-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Chat</h2>

          {/* Recipient dropdown */}
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full border rounded p-1 mb-2 text-sm"
          >
            {role === "parent" && (
              <>
                <option value="teacher">Subject Teacher</option>
                <option value="principal">Principal</option>
                <option value="helpdesk">Helpdesk</option>
              </>
            )}
            {role === "teacher" && (
              <>
                <option value="principal">Principal</option>
                <option value="helpdesk">Helpdesk</option>
              </>
            )}
            {role === "principal" && (
              <>
                <option value="helpdesk">Helpdesk</option>
                {/* Principal already has teacher/parent dropdown in your dashboard */}
              </>
            )}
          </select>

          {/* Messages */}
          <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2 text-xs">
            {messages.length > 0 ? (
              messages.map((m) => (
                <div key={m.id} className="mb-1">
                  <span
                    className={`font-medium ${
                      m.sender === uid ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {m.sender === uid ? "You" : m.sender}:
                  </span>{" "}
                  {m.text}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No messages yet.</p>
            )}
          </div>

          {/* Input */}
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
