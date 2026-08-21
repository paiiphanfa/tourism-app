const { Schema, model } = require("mongoose");

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  messages: { type: [chatMessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model("ChatSession", chatSessionSchema);
