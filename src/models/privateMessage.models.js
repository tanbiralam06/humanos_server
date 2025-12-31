import mongoose, { Schema } from "mongoose";

const privateMessageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "PrivateChat",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for retrieving messages for a chat sorted by time
privateMessageSchema.index({ chatId: 1, createdAt: 1 });

export const PrivateMessage = mongoose.model(
  "PrivateMessage",
  privateMessageSchema,
);
