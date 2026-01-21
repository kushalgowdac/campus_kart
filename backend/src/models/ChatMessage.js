import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    fromUserId: { type: Number, required: true },
    toUserId: { type: Number, required: true },
    message: { type: String, required: true },
    productId: { type: Number, required: false },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);
