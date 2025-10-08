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
  uid: string;
  initialRecipient?: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function ChatWidget({
  role,
  uid,
  initialRecipient,
  forceOpen,
  onClose,
}: ChatWidgetProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [recipient, setRecipient] = useState(initialRecipient || "principal");
  const [recipientName, setRecipientName] = useState<string>("Recipient");
  const [recipientPhoto, setRecipientPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const typingTimeout = useRef<any>(null);

  const conversationId = [uid, recipient].sort().join("_");

  /* 🔹 Fetch recipient info */
  useEffect(() => {
    if (!recipient) return;

    const fetchRecipientInfo = async () => {
      try {
        // 👇 Example: look up recipient in "parents" collection by ID/email
        const parentDoc = await getDoc(doc(db, "parents", recipient));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setRecipientName(data.name || recipient);
          setRecipientPhoto(data.photoURL || null);
          return;
        }

        // fallback generic
        setRecipientName(recipient);
        setRecipientPhoto(null);
      } catch (err) {
        console.error("Error fetching recipient info", err);
        setRecipientName(recipient);
      }
    };

    fetchRecipientInfo();
  }, [recipient]);

  /* 🔹 Subscribe to messages */
  useEffect(() => {
    if (!recipient) return;
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    });
    return () => unsub();
  }, [conversationId, recipient]);

  /* 🔹 Subscribe to typing state */
  useEffect(() => {
    if (!recipient) return;
    const ref = doc(db, "conversations", conversationId, "typing", recipient);
    const unsub = onSnapshot(ref, (snap) => {
      setIsRecipientTyping(snap.exists() && snap.data().isTyping);
    });
    return () => unsub();
  }, [conversationId, recipient]);

  /* 🔹 Update typing */
  const updateTyping = async (isTyping: boolean) => {
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
    if (!message.trim()) return;
    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      sender: uid,
      recipient,
      text: message,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        participants: [uid, recipient],
        lastMessage: message,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setMessage("");
    await updateTyping(false);
  };

  /* 🔹 Auto open if forced */
  useEffect(() => {
    if (forceOpen) setChatOpen(true);
  }, [forceOpen]);

  const toggleChat = () => {
    const newState = !chatOpen;
    setChatOpen(newState);
    if (!newState && onClose) onClose();
  };

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
          {/* ✅ Header with name + photo */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              {recipientPhoto ? (
                <img
                  src={recipientPhoto}
                  alt={recipientName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300"></div>
              )}
              <span className="text-sm font-semibold">{recipientName}</span>
            </div>
            <button
              className="text-gray-400 hover:text-black text-sm"
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-48 overflow-y-auto p-2 text-xs">
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
          </div>

          {/* ✅ Typing Indicator */}
          {isRecipientTyping && (
            <p className="text-xs text-green-600 px-2 mb-1">
              ✍️ {recipientName} is typing…
            </p>
          )}

          {/* Input */}
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
