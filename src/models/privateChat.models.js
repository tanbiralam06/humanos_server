import mongoose, { Schema } from "mongoose";

const privateChatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Tracks who is currently "online" in this specific chat screen
    activeParticipants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique conversation between two users
// We'll handle uniqueness logic in the controller/socket service effectively
// but an index can help if we enforce a sorted array of participants.
// For simplicity, we won't enforce a unique index at DB level yet because
// array order matters in mongo unique indexes unless standardized.

export const PrivateChat = mongoose.model("PrivateChat", privateChatSchema);
