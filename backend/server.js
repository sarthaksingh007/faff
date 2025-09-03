require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { indexMessageOnQdrant } = require('./services/semantic');

const apiRoutes = require("./routes/api");
const Message = require("./models/Message");

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));

app.use("/api", apiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN },
});

// in-memory map userId -> socketId(s)
const userSockets = new Map();

// ----------------------
// Lightweight monitoring
// ----------------------
let messagesInWindow = 0;
let lastWindowTs = Date.now();

function getActiveSocketCount() {
  let total = 0;
  for (const set of userSockets.values()) total += set.size;
  return total;
}

// Log every 5s: messages/sec (avg over window) and active sockets
setInterval(() => {
  const now = Date.now();
  const elapsedSec = Math.max(1, Math.round((now - lastWindowTs) / 1000));
  const mps = Math.round(messagesInWindow / elapsedSec);
  const activeSockets = getActiveSocketCount();
  const mem = process.memoryUsage();
  console.log(
    JSON.stringify({
      t: new Date().toISOString(),
      metric: "runtime",
      messages_per_sec: mps,
      active_sockets: activeSockets,
      rss_mb: Math.round(mem.rss / (1024 * 1024)),
      heap_used_mb: Math.round(mem.heapUsed / (1024 * 1024)),
    })
  );
  messagesInWindow = 0;
  lastWindowTs = now;
}, 5000);

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // client should emit 'identify' with their userId after connecting
  socket.on("identify", (userId) => {
    if (!userId) return;
    const set = userSockets.get(userId) || new Set();
    set.add(socket.id);
    userSockets.set(userId, set);
    socket.userId = userId;
    console.log("identify", userId, Array.from(set));
  });

  socket.on("private_message", async (payload) => {
    try {
      const { senderId, receiverId, message } = payload;
      if (!senderId || !receiverId || !message) return;
  
      const startWrite = Date.now();
      // persist in Mongo
      const msg = await Message.create({ senderId, receiverId, message });
      const writeMs = Date.now() - startWrite;
      messagesInWindow += 1;
      console.log(
        JSON.stringify({
          t: new Date().toISOString(),
          metric: "mongo_write_ms",
          value: writeMs,
        })
      );
  
      // index in Qdrant (async, don't block)
      indexMessageOnQdrant({
        _id: msg._id,
        message: msg.message,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        createdAt: msg.createdAt,
      }).catch((err) => console.error("qdrant index failed:", err));
  
      // send to receiver if connected
      const receiverSockets = userSockets.get(receiverId);
      if (receiverSockets) {
        for (const sid of receiverSockets) {
          io.to(sid).emit("new_message", {
            _id: msg._id,
            senderId,
            receiverId,
            message,
            createdAt: msg.createdAt,
          });
        }
      }
  
      // also emit to sender's other sockets
      const senderSockets = userSockets.get(senderId);
      if (senderSockets) {
        for (const sid of senderSockets) {
          io.to(sid).emit("message_sent", {
            _id: msg._id,
            senderId,
            receiverId,
            message,
            createdAt: msg.createdAt,
          });
        }
      }
    } catch (err) {
      console.error("socket message error", err);
    }
  });
  

  socket.on("disconnect", () => {
    const uid = socket.userId;
    if (uid && userSockets.has(uid)) {
      const set = userSockets.get(uid);
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(uid);
      else userSockets.set(uid, set);
    }
    console.log("socket disconnected", socket.id);
  });
});

// connect mongoose then start server
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/hs-chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongodb connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
  });
