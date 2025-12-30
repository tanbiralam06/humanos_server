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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check for existing UNREAD notification of same type/recipient from today
    const existingNotification = await Notification.findOne({
      recipient,
      type,
      isRead: false,
      createdAt: { $gte: today },
    });

    let notification;

    if (existingNotification) {
      // 2. Aggregate
      const newCount = (existingNotification.groupCount || 0) + 1;
      let newMessage = message;

      // Simple text aggregation logic
      // Assuming message format: "started following you"
      if (type === "FOLLOW") {
        newMessage = `and ${newCount} others started following you`;
      } else if (type === "LIKE") {
        newMessage = `and ${newCount} others liked your post`;
      }

      notification = await Notification.findByIdAndUpdate(
        existingNotification._id,
        {
          sender, // Update to show the LATEST actor
          message: newMessage,
          groupCount: newCount,
          $inc: { __v: 1 }, // Force update timestamp
        },
        { new: true },
      ).populate("sender", "username fullName avatar");
    } else {
      // 3. Create New
      notification = await Notification.create({
        recipient,
        sender,
        type,
        message,
        relatedId,
        groupCount: 0,
      });
      // Populate for socket
      notification = await notification.populate(
        "sender",
        "username fullName avatar",
      );
    }

    // Real-time socket event
    try {
      const io = getIO();
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
