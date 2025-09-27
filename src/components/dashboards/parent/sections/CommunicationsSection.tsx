"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  text: string;
  createdAt: any;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export default function CommunicationsSection({ parentId }: { parentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatTo, setChatTo] = useState<"teacher" | "principal">("teacher");
  const [newMessage, setNewMessage] = useState("");

  // 🔹 Listen for announcements
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(items);
    });
    return () => unsub();
  }, []);

  // 🔹 Listen for ALL messages where parent is involved (sender or recipient)
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(items.filter((m) => m.sender === parentId || m.recipient === parentId));
    });
    return () => unsub();
  }, [parentId]);

  // 🔹 Send new chat message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "messages"), {
      sender: parentId,
      recipient: chatTo,
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
    <div className="space-y-6">
      {/* 🎓 Subject Teacher Chat */}
      <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 shadow-md">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">
          🎓 Subject Teacher Chat
        </h2>

        <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-white">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span
                  className={
                    msg.sender === parentId ? "font-medium text-blue-600" : "font-medium text-gray-700"
                  }
                >
                  {msg.sender === parentId ? "You" : msg.sender}:
                </span>{" "}
                {msg.text}
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              Any communications contact helpdesk at 076...
            </p>
          )}
        </div>

        {/* Chatbox */}
        <div className="mt-3 flex gap-2">
          <select
            value={chatTo}
            onChange={(e) => setChatTo(e.target.value as any)}
            className="border rounded p-1 text-sm"
          >
            <option value="teacher">Subject Teacher</option>
            <option value="principal">Principal</option>
          </select>
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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

      {/* 🏫 School Announcements */}
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
              Any technical issues contact helpdesk at (+27)65 656 4983
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
