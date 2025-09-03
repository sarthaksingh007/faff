const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Message = require("../models/Message");
const { semanticSearchForUser, indexMessageOnQdrant } = require("../services/semantic");

router.get("/semantic-search", async (req, res) => {
  try {
    const { userId, q, top = 10 } = req.query;
    if (!userId || !q)
      return res.status(400).json({ error: "userId and q query required" });

    const hits = await semanticSearchForUser(userId, q, parseInt(top, 10));

    // Map to useful response
    const results = hits.map((h) => ({
      mongoId: h.payload?.mongoId || "",
      id: h.id,
      message: h.payload?.message || "",
      score: h.score,
      createdAt: h.payload?.createdAt || null,
      senderId: h.payload?.senderId,
      receiverId: h.payload?.receiverId,
    }));

    res.json(results);
  } catch (err) {
    console.error("semantic-search error", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /users
// Auth: Signup
router.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });
    const existing = await User.findOne({ email });
    if (existing) {
      // Upgrade legacy user without passwordHash
      if (!existing.passwordHash) {
        existing.name = name || existing.name;
        existing.passwordHash = await bcrypt.hash(password, 10);
        await existing.save();
        return res.json({ _id: existing._id, name: existing.name, email: existing.email });
      }
      return res.status(409).json({ error: "email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Auth: Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash)
      return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("name email");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /messages
router.post("/messages", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message)
      return res.status(400).json({ error: "missing fields" });
    const msg = await Message.create({ senderId, receiverId, message });

    // index into qdrant (don't block response too long — but still await for v0 simplicity)
    indexMessageOnQdrant({
      _id: msg._id,
      message: msg.message,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      createdAt: msg.createdAt,
    }).catch((err) => {
      console.error("qdrant index error", err);
    });

    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /messages?userId=abc&limit=99
router.get("/messages", async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;
    console.log("req.query", req.query);

    if (!userId) return res.status(400).json({ error: "userId required" });

    // fetch messages where user is sender or receiver, sorted descending by createdAt
    const msgs = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
