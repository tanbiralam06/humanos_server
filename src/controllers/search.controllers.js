import { Chatroom } from "../models/chatroom.models.js";
import { User } from "../models/user.models.js";
import { Block } from "../models/block.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// Universal search - search for people and chatrooms
const universalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          people: [],
          chatrooms: [],
        },
        "No search query provided",
      ),
    );
  }

  const searchQuery = q.trim();

  // Get list of blocked user IDs (users blocked by current user)
  const blockedByUser = await Block.find({ blocker: req.user._id }).distinct(
    "blocked",
  );

  // Get list of users who blocked the current user
  const blockedByOthers = await Block.find({ blocked: req.user._id }).distinct(
    "blocker",
  );

  // Combine both lists to exclude them from search results
  const excludedUserIds = [
    ...blockedByUser,
    ...blockedByOthers,
    req.user._id, // Also exclude self
  ];

  // Search for users (people)
  const people = await User.aggregate([
    {
      $match: {
        _id: { $nin: excludedUserIds }, // Exclude blocked users & self
        $or: [
          { username: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "owner",
        as: "profile",
      },
    },
    {
      $unwind: {
        path: "$profile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        fullName: "$profile.fullName",
        avatar: "$profile.avatar",
      },
    },
    {
      $limit: 10,
    },
  ]);

  // Search for chatrooms
  const chatrooms = await Chatroom.find({
    isActive: true,
    $or: [
      { name: { $regex: searchQuery, $options: "i" } },
      { topic: { $regex: searchQuery, $options: "i" } },
    ],
  })
    .populate("createdBy", "username")
    .limit(10);

  // Add participant count to chatrooms
  const chatroomsWithCount = chatrooms.map((room) => ({
    ...room.toObject(),
    participantCount: room.participants.length,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        people,
        chatrooms: chatroomsWithCount,
      },
      "Search results fetched successfully",
    ),
  );
});

export { universalSearch };
