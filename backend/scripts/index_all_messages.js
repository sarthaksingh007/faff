// backend/scripts/index_all_messages.js
require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const { indexMessageOnQdrant } = require("../services/semantic");

async function run() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/hs-chat"
  );
  console.log("connected to mongo");

  const cursor = Message.find().cursor();
  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      await indexMessageOnQdrant({
        _id: doc._id,
        message: doc.message,
        senderId: doc.senderId,
        receiverId: doc.receiverId,
        createdAt: doc.createdAt,
      });
      count++;
      if (count % 50 === 0) console.log(`indexed ${count} messages`);
    } catch (e) {
      console.error("failed to index", doc._id, e.message);
    }
  }

  console.log("done, total indexed:", count);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
