import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User", // The user who performed the action (optional for system Notifs)
    },
    type: {
      type: String,
      enum: ["FOLLOW", "NEARBY", "SYSTEM", "MESSAGE"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      // Can be ProfileId, UserId, ChatroomId, etc.
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    groupCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Notification = mongoose.model("Notification", notificationSchema);
