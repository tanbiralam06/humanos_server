import Link from "mongoose";
import { Follow } from "../models/follow.models.js";
import mongoose from "mongoose";
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

const getFollowingList = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const followingList = await Follow.aggregate([
    {
      $match: {
        follower: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profiles",
        localField: "following",
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
        _id: "$user._id",
        username: "$user.username",
        email: "$user.email",
        fullName: "$profile.fullName",
        avatar: "$profile.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        followingList,
        "Following list fetched successfully",
      ),
    );
});

export { toggleFollow, getFollowStatus, getFollowingList };
