import { Chatroom } from "../models/chatroom.models.js";
import { Message } from "../models/message.models.js";
import { Notification } from "../models/notification.models.js";

// --- Chat & Message Cleanup ---
export const runMessageCleanup = async () => {
  try {
    // Delete messages older than 1 hour
    const deletedMessages = await Message.deleteOldMessages();
    if (deletedMessages > 0) {
      console.log(`Cleaned up ${deletedMessages} old messages`);
    }

    // Delete inactive chatrooms (no activity for 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const inactiveChatrooms = await Chatroom.updateMany(
      {
        lastActivity: { $lt: oneHourAgo },
        isActive: true,
      },
      {
        isActive: false,
      },
    );

    if (inactiveChatrooms.modifiedCount > 0) {
      console.log(
        `Deactivated ${inactiveChatrooms.modifiedCount} inactive chatrooms`,
      );
    }

    // Delete messages from inactive rooms
    const inactiveRoomIds = await Chatroom.find({ isActive: false }).select(
      "_id",
    );
    const roomIds = inactiveRoomIds.map((room) => room._id);

    if (roomIds.length > 0) {
      await Message.deleteMany({ roomId: { $in: roomIds } });
    }
  } catch (error) {
    console.error("Message Cleanup service error:", error);
  }
};

// --- Notification Cleanup ---
export const runNotificationCleanup = async () => {
  try {
    console.log("Running Notification Cleanup Job...");
    const now = new Date();

    // 1. Delete READ notifications older than 14 days
    const readThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const readResult = await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: readThreshold },
    });

    // 2. Delete UNREAD notifications older than 60 days
    const unreadThreshold = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const unreadResult = await Notification.deleteMany({
      isRead: false,
      createdAt: { $lt: unreadThreshold },
    });

    console.log(
      `Notification Cleanup: ${readResult.deletedCount} Read, ${unreadResult.deletedCount} Unread deleted.`,
    );
  } catch (error) {
    console.error("Notification Cleanup error:", error);
  }
};

// Initialize All Cleanup Jobs
export const startCleanupService = () => {
  console.log("Initializing Cleanup Services...");

  // 1. Message/Chatroom Cleanup (Every 10 minutes)
  runMessageCleanup(); // Run immediately
  setInterval(runMessageCleanup, 10 * 60 * 1000);

  // 2. Notification Cleanup (Every 24 hours)
  runNotificationCleanup(); // Run immediately
  setInterval(runNotificationCleanup, 24 * 60 * 60 * 1000);

  console.log("All Cleanup Services Started.");
};
