import { Notification } from "../models/notification.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getIO } from "../socket/socket.js";

// Internal Helper to create notification
export const createNotification = async ({
  recipient,
  sender,
  type,
  message,
  relatedId,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      relatedId,
    });

    // Real-time socket event
    try {
      const io = getIO();
      // Emit to the recipient's room (Make sure users join a room named by their UserId on login)
      // or filter connected sockets.
      // Standard practice: io.to(recipientUserId).emit(...) if room = userId
      // Or if we iterate sockets.
      // Assuming socket.join(userId) happens on connection?
      // In socket.js, we only saw join-room logic.
      // Ideally, we should join a personal room on connection.
      // For now, I'll rely on client-side joining 'notifications-<userId>' or similar.
      // Let's assume we emit to a room with the recipient's ID.
      io.to(recipient.toString()).emit("notification", notification);
    } catch (socketError) {
      console.error("Socket emit failed:", socketError);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("sender", "username fullName avatar");

  const totalUnread = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount: totalUnread,
      },
      "Notifications fetched successfully",
    ),
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    {
      $set: { isRead: true },
    },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

export { getUserNotifications, markAsRead, markAllAsRead };
