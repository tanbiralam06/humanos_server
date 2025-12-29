import mongoose, { Schema } from "mongoose";

const chatroomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        isAnonymous: {
          type: Boolean,
          default: false,
        },
        anonymousName: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
chatroomSchema.index({ isActive: 1, lastActivity: -1 });
chatroomSchema.index({ topic: "text", name: "text" });

// Method to update last activity
chatroomSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get active rooms
chatroomSchema.statics.getActiveRooms = function () {
  return this.find({ isActive: true }).sort({ lastActivity: -1 });
};

export const Chatroom = mongoose.model("Chatroom", chatroomSchema);
