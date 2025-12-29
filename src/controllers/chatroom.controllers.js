import { Chatroom } from "../models/chatroom.models.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// Create a new chatroom
const createChatroom = asyncHandler(async (req, res) => {
  const { name, topic, description } = req.body;

  if (!name || !topic) {
    throw new ApiError(400, "Name and topic are required");
  }

  const chatroom = await Chatroom.create({
    name,
    topic,
    description: description || "",
    createdBy: req.user._id,
    participants: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, chatroom, "Chatroom created successfully"));
});

// Get all active chatrooms
const getAllChatrooms = asyncHandler(async (req, res) => {
  const chatrooms = await Chatroom.getActiveRooms()
    .populate("createdBy", "username")
    .select("-__v");

  // Add participant count to each room
  const chatroomsWithCount = chatrooms.map((room) => ({
    ...room.toObject(),
    participantCount: room.participants.length,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        chatroomsWithCount,
        "Chatrooms fetched successfully",
      ),
    );
});

// Get chatroom details
const getChatroomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const chatroom = await Chatroom.findById(roomId)
    .populate("createdBy", "username email")
    .select("-__v");

  if (!chatroom) {
    throw new ApiError(404, "Chatroom not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chatroom, "Chatroom details fetched"));
});

// Join a chatroom
const joinChatroom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { isAnonymous } = req.body;

  const chatroom = await Chatroom.findById(roomId);

  if (!chatroom) {
    throw new ApiError(404, "Chatroom not found");
  }

  if (!chatroom.isActive) {
    throw new ApiError(400, "This chatroom is no longer active");
  }

  // Check if user already in room
  const alreadyJoined = chatroom.participants.some(
    (p) => p.userId.toString() === req.user._id.toString(),
  );

  if (alreadyJoined) {
    throw new ApiError(400, "You have already joined this room");
  }

  // Generate anonymous name if needed
  const anonymousName = isAnonymous
    ? `Guest_${Math.floor(1000 + Math.random() * 9000)}`
    : null;

  // Add participant
  chatroom.participants.push({
    userId: req.user._id,
    username: req.user.username,
    isAnonymous: isAnonymous || false,
    anonymousName,
  });

  await chatroom.updateActivity();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        roomId: chatroom._id,
        displayName: isAnonymous ? anonymousName : req.user.username,
        isAnonymous: isAnonymous || false,
      },
      "Joined chatroom successfully",
    ),
  );
});

// Leave a chatroom
const leaveChatroom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const chatroom = await Chatroom.findById(roomId);

  if (!chatroom) {
    throw new ApiError(404, "Chatroom not found");
  }

  // Remove participant
  chatroom.participants = chatroom.participants.filter(
    (p) => p.userId.toString() !== req.user._id.toString(),
  );

  await chatroom.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left chatroom successfully"));
});

// Get messages for a chatroom
const getChatroomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit) || 100;

  const messages = await Message.getRoomMessages(roomId, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

export {
  createChatroom,
  getAllChatrooms,
  getChatroomDetails,
  joinChatroom,
  leaveChatroom,
  getChatroomMessages,
};
