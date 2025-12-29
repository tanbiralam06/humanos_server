import { Follow } from "../models/follow.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const toggleFollow = asyncHandler(async (req, res) => {
  const { userId } = req.params; // The user to follow/unfollow

  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const existingFollow = await Follow.findOne({
    follower: req.user._id,
    following: userId,
  });

  if (existingFollow) {
    // Unfollow
    await Follow.findByIdAndDelete(existingFollow._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isFollowing: false }, "Unfollowed successfully"),
      );
  } else {
    // Follow
    await Follow.create({
      follower: req.user._id,
      following: userId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isFollowing: true }, "Followed successfully"),
      );
  }
});

const getFollowStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const existingFollow = await Follow.findOne({
    follower: req.user._id,
    following: userId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isFollowing: !!existingFollow,
      },
      "Follow status fetched successfully",
    ),
  );
});

export { toggleFollow, getFollowStatus };
