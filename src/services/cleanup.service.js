import { Chatroom } from "../models/chatroom.models.js";
import { Message } from "../models/message.models.js";

// Cleanup service that runs periodically
export const cleanupService = async () => {
  try {
    // Delete messages older than 1 hour
    const deletedMessages = await Message.deleteOldMessages();
    console.log(`Cleaned up ${deletedMessages} old messages`);

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

    console.log(
      `Deactivated ${inactiveChatrooms.modifiedCount} inactive chatrooms`,
    );

    // Delete messages from inactive rooms
    const inactiveRoomIds = await Chatroom.find({ isActive: false }).select(
      "_id",
    );
    const roomIds = inactiveRoomIds.map((room) => room._id);

    if (roomIds.length > 0) {
      await Message.deleteMany({ roomId: { $in: roomIds } });
    }
  } catch (error) {
    console.error("Cleanup service error:", error);
  }
};

// Run cleanup every 10 minutes
export const startCleanupService = () => {
  // Run immediately on start
  cleanupService();

  // Then run every 10 minutes
  setInterval(cleanupService, 10 * 60 * 1000);
  console.log("Cleanup service started");
};
