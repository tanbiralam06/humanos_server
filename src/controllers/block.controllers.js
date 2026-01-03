import { Block } from "../models/block.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Check if user exists
  const userToBlock = await User.findById(userId);
  if (!userToBlock) {
    throw new ApiError(404, "User not found");
  }

  if (userId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const existingBlock = await Block.findOne({
    blocker: req.user._id,
    blocked: userId,
  });

  if (existingBlock) {
    // If already blocked, unblock
    await Block.findByIdAndDelete(existingBlock._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isBlocked: false },
          "User unblocked successfully",
        ),
      );
  } else {
    // If not blocked, block
    await Block.create({
      blocker: req.user._id,
      blocked: userId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isBlocked: true }, "User blocked successfully"),
      );
  }
});

const getBlockedUsers = asyncHandler(async (req, res) => {
  const blockedUsers = await Block.find({ blocker: req.user._id }).populate(
    "blocked",
    "username fullName avatar email",
  );

  const formattedUsers = blockedUsers.map((block) => block.blocked);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedUsers,
        "Blocked users fetched successfully",
      ),
    );
});

export { toggleBlockUser, getBlockedUsers };
