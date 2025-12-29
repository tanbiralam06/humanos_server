import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Chatroom",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
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

// Index for faster queries and auto-deletion
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ createdAt: 1 }); // For TTL cleanup

// Static method to get room messages
messageSchema.statics.getRoomMessages = function (roomId, limit = 100) {
  return this.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v");
};

// Static method to delete old messages (older than 1 hour)
messageSchema.statics.deleteOldMessages = async function () {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await this.deleteMany({ createdAt: { $lt: oneHourAgo } });
  return result.deletedCount;
};

export const Message = mongoose.model("Message", messageSchema);
