import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "../models/message.models.js";
import { Chatroom } from "../models/chatroom.models.js";
import { PrivateChat } from "../models/privateChat.models.js";
import { PrivateMessage } from "../models/privateMessage.models.js";
import mongoose from "mongoose";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:8081",
      credentials: true,
    },
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded._id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Join personal room for notifications
    socket.join(socket.userId);

    // Join a chatroom
    socket.on("join-room", async ({ roomId, isAnonymous, displayName }) => {
      try {
        const chatroom = await Chatroom.findById(roomId);

        if (!chatroom) {
          socket.emit("error", { message: "Chatroom not found" });
          return;
        }

        // Join the socket room
        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.displayName = displayName;
        socket.isAnonymous = isAnonymous;

        // Notify others in the room
        socket.to(roomId).emit("user-joined", {
          username: displayName,
          timestamp: new Date(),
        });

        console.log(`${displayName} joined room: ${roomId}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Send a message
    socket.on("send-message", async ({ roomId, content }) => {
      try {
        if (!content || !content.trim()) {
          return;
        }

        // Save message to database
        const message = await Message.create({
          roomId,
          userId: socket.userId,
          username: socket.displayName,
          isAnonymous: socket.isAnonymous,
          content: content.trim(),
        });

        // Update room activity
        await Chatroom.findByIdAndUpdate(roomId, {
          lastActivity: new Date(),
        });

        // Broadcast message to all users in the room
        io.to(roomId).emit("new-message", {
          _id: message._id,
          username: message.username,
          content: message.content,
          isAnonymous: message.isAnonymous,
          createdAt: message.createdAt,
        });

        console.log(`Message sent in room ${roomId} by ${socket.displayName}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Leave a room
    socket.on("leave-room", async ({ roomId }) => {
      try {
        socket.leave(roomId);

        // Notify others
        socket.to(roomId).emit("user-left", {
          username: socket.displayName,
          timestamp: new Date(),
        });

        console.log(`${socket.displayName} left room: ${roomId}`);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

    // --- PRIVATE CHAT LOGIC ---

    socket.on("join-private-chat", async ({ targetUserId }) => {
      try {
        const userId = socket.userId;
        const participants = [userId, targetUserId].sort();

        // 1. Find or create the PrivateChat session
        // We verify if there is an existing chat with these exact participants
        let privateChat = await PrivateChat.findOne({
          participants: { $all: participants, $size: 2 },
        });

        if (!privateChat) {
          privateChat = await PrivateChat.create({
            participants,
            activeParticipants: [userId], // First one joining
          });
        } else {
          // Add user to active participants if not already
          if (
            !privateChat.activeParticipants.some(
              (id) => id.toString() === userId,
            )
          ) {
            privateChat.activeParticipants.push(userId);
            await privateChat.save();
          }
        }

        const chatId = privateChat._id.toString();
        const roomName = `private_${chatId}`;

        socket.join(roomName);
        socket.currentPrivateRoom = roomName; // Track for disconnect
        socket.currentPrivateChatId = chatId;

        // --- NEW: Mark messages as READ ---
        // If I am joining, messages sent by the OTHER person should be marked read
        // Ensure userId is treated as ObjectId for comparison if needed, or rely on Mongoose casting
        // Using $ne with string vs ObjectId can sometimes be flaky.
        const updateResult = await PrivateMessage.updateMany(
          { chatId, senderId: { $ne: userId }, isRead: false },
          { $set: { isRead: true } },
        );
        console.log(
          `Marked ${updateResult.modifiedCount} messages as read for user ${userId} in chat ${chatId}`,
        );

        // 2. Fetch existing temporary messages
        const history = await PrivateMessage.find({ chatId }).sort({
          createdAt: 1,
        });

        socket.emit("private-chat-init", {
          chatId,
          messages: history,
        });

        console.log(
          `User ${socket.username} joined private chat ${chatId} with ${targetUserId}`,
        );
      } catch (error) {
        console.error("Error joining private chat:", error);
        socket.emit("error", { message: "Failed to join private chat" });
      }
    });

    socket.on("send-private-message", async ({ chatId, content }) => {
      try {
        if (!content || !content.trim()) return;

        // Check if recipient is active in this chat RIGHT NOW
        let isRead = false;
        const chat = await PrivateChat.findById(chatId);
        if (chat) {
          const recipientId = chat.participants
            .find((id) => id.toString() !== socket.userId)
            ?.toString();
          if (
            recipientId &&
            chat.activeParticipants
              .map((id) => id.toString())
              .includes(recipientId)
          ) {
            isRead = true;
          }
        }

        const message = await PrivateMessage.create({
          chatId,
          senderId: socket.userId,
          content: content.trim(),
          isRead,
        });

        // Broadcast to the specific private room
        io.to(`private_${chatId}`).emit("new-private-message", message);

        // --- NEW: Notify Recipient ---
        // Reuse 'chat' from above or fetch if null (though it unlikely changed in ms)
        if (chat) {
          const recipientId = chat.participants.find(
            (id) => id.toString() !== socket.userId,
          );
          if (recipientId) {
            // Emit notification to the recipient's personal room
            // (Assuming they joined their userId room on connection)
            io.to(recipientId.toString()).emit("private-message-notification", {
              senderId: socket.userId,
              username: socket.displayName,
              content:
                content.substring(0, 50) + (content.length > 50 ? "..." : ""),
              chatId,
            });
          }
        }
      } catch (error) {
        console.error("Error sending private message:", error);
        socket.emit("error", { message: "Failed to send private message" });
      }
    });

    socket.on("leave-private-chat", async ({ chatId }) => {
      try {
        socket.leave(`private_${chatId}`);
        socket.currentPrivateRoom = null;
        socket.currentPrivateChatId = null;

        await handlePrivateChatLeave(chatId, socket.userId);
      } catch (error) {
        console.error("Error leaving private chat:", error);
      }
    });

    // Helper to handle cleanup
    const handlePrivateChatLeave = async (chatId, userId) => {
      const privateChat = await PrivateChat.findById(chatId);
      if (!privateChat) return;

      // Remove user from active participants
      privateChat.activeParticipants = privateChat.activeParticipants.filter(
        (id) => id.toString() !== userId,
      );
      await privateChat.save();

      console.log(
        `User ${userId} left chat ${chatId}. Active: ${privateChat.activeParticipants.length}`,
      );

      // Check if NO ONE is left
      if (privateChat.activeParticipants.length === 0) {
        // DEBUG: Check message status
        const totalMessages = await PrivateMessage.countDocuments({ chatId });
        const readMessages = await PrivateMessage.countDocuments({
          chatId,
          isRead: true,
        });
        const unreadMessages = await PrivateMessage.countDocuments({
          chatId,
          isRead: false,
        });

        console.log(
          `Private chat ${chatId} empty. Tot: ${totalMessages}, Read: ${readMessages}, Unread: ${unreadMessages}`,
        );

        if (readMessages > 0) {
          console.log(`Deleting ${readMessages} READ messages...`);
          await PrivateMessage.deleteMany({ chatId, isRead: true });
        } else {
          console.log("No READ messages to delete.");
        }
      }
    };

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.username}`);

      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("user-left", {
          username: socket.displayName,
          timestamp: new Date(),
        });
      }

      // Handle private chat disconnect
      if (socket.currentPrivateChatId) {
        await handlePrivateChatLeave(
          socket.currentPrivateChatId,
          socket.userId,
        );
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
