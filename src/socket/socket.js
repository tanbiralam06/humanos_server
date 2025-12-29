import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "../models/message.models.js";
import { Chatroom } from "../models/chatroom.models.js";

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

    // Typing indicator
    socket.on("typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("user-typing", {
        username: socket.displayName,
        isTyping,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.username}`);

      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("user-left", {
          username: socket.displayName,
          timestamp: new Date(),
        });
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
