import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { createUser, fetchMessages, fetchUsers, sendMessageREST } from "../api";
import SemanticSearch from "./SemanticSearch";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export default function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [peerId, setPeerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef();

  useEffect(() => {
    async function init() {
      // load all users (except self)
      const allUsers = await fetchUsers();
      setUsers(allUsers.filter((u) => u._id !== user._id));

      // fetch past messages for context
      const msgs = await fetchMessages(user._id, 200);
      setMessages(msgs.slice().reverse());

      // optionally pick first peer
      if (allUsers.length > 1) {
        setPeerId(allUsers.find((u) => u._id !== user._id)._id);
      }
    }

    init();

    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("identify", user._id);
    });
    socket.on("new_message", (m) => {
      setMessages((prev) => [...prev, m]);
    });
    socket.on("message_sent", (m) => {
      setMessages((prev) => [...prev, m]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!peerId) return alert("pick someone to chat with (choose a recipient)");
    if (!text) return;
    const payload = { senderId: user._id, receiverId: peerId, message: text };
    // send over socket for realtime and persistence (server persists on socket)
    socketRef.current.emit("private_message", payload);
    setText("");
  };

  const startConversation = async (u) => {
    setPeerId(u._id);
  };
  const messageRefs = useRef({});
  console.log("messageRefs", messageRefs);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 p-6 border-r bg-white flex flex-col">
        {/* User Info */}
        <div className="mb-6 pb-4 border-b">
          <div className="font-bold text-lg">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>

        <button
          onClick={onLogout}
          className="mb-6 text-sm text-red-600 hover:text-red-700 transition"
        >
          Logout
        </button>

        {/* Chats */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="font-semibold mb-3 text-gray-700">Chats</h3>
          <div className="space-y-2">
            {users.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No chats yet — message someone by email to create a user.
              </div>
            )}
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => startConversation(u)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  peerId === u._id
                    ? "bg-blue-100 border border-blue-300"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="font-medium text-gray-800">{u.name}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            {peerId
              ? `Chat with ${
                  users.find((u) => u._id === peerId)?.name || "..."
                }`
              : "Select a chat"}
          </h2>
        </div>
        <div className="">
          <SemanticSearch
            user={user}
            onOpenConversation={(otherUserId, messageId) => {
              setPeerId(otherUserId);

              // scroll using ref, not getElementById
              const el = messageRefs.current[messageId];
              console.log("el", el);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              } else {
                console.log("Message not found in refs yet");
              }
            }}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {messages
              .filter((m) => {
                const sid = m.senderId._id || m.senderId;
                const rid = m.receiverId._id || m.receiverId;
                return (
                  (sid === user._id && rid === peerId) ||
                  (sid === peerId && rid === user._id)
                );
              })
              .map((m) => {
                console.log("m", m);
                
                const sender =
                  typeof m.senderId === "object"
                    ? m.senderId
                    : { _id: m.senderId };
                const sid = sender._id;
                const mine = sid === user._id;

                const displayName = mine
                  ? "You"
                  : users.find((u) => u._id === sender._id)?.name || "Unknown";

                return (
                  <div
                    key={m._id || m.createdAt}
                    ref={(el) => (messageRefs.current[m._id] = el)}
                    className={`max-w-xs ${mine ? "ml-auto text-right" : ""}`}
                  >
                    <div
                      className={`inline-block px-3 py-2 rounded ${
                        mine ? "bg-blue-500 text-white" : "bg-gray-200"
                      }`}
                    >
                      {m.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {displayName}
                    </div>
                  </div>
                );
              })}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 border-t bg-white flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            className="px-5 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
