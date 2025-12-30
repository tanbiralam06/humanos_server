import { Profile } from "../models/profile.models.js";
import { User } from "../models/user.models.js";
import { Follow } from "../models/follow.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ owner: req.user._id }).populate(
    "owner",
    "username email",
  );

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const followersCount = await Follow.countDocuments({
    following: req.user._id,
  });
  const followingCount = await Follow.countDocuments({
    follower: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...profile.toObject(), followersCount, followingCount },
        "Profile fetched successfully",
      ),
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, location, username } = req.body;

  // 1. Handle Username Update (if provided and different)
  if (username && username !== req.user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ApiError(409, "Username already taken");
    }
    // Update USER model
    await User.findByIdAndUpdate(req.user._id, {
      $set: { username: username.toLowerCase() },
    });
  }

  // 2. Update PROFILE model
  const profile = await Profile.findOneAndUpdate(
    { owner: req.user._id },
    {
      $set: {
        fullName,
        bio,
        location,
      },
    },
    { new: true }, // Return the updated document
  ).populate("owner", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully"));
});

const getUserProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await Profile.findOne({ owner: userId }).populate(
    "owner",
    "username email",
  );

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const followersCount = await Follow.countDocuments({
    following: userId,
  });
  const followingCount = await Follow.countDocuments({
    follower: userId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...profile.toObject(), followersCount, followingCount },
        "User profile fetched successfully",
      ),
    );
});

export { getMyProfile, updateProfile, getUserProfileById };

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, long, accuracy, isSharing } = req.body;

  if (!lat || !long) {
    throw new ApiError(400, "Latitude and Longitude are required");
  }

  // Update Profile with new location data
  const profile = await Profile.findOneAndUpdate(
    { owner: req.user._id },
    {
      $set: {
        "location.type": "Point",
        "location.coordinates": [parseFloat(long), parseFloat(lat)], // GeoJSON expects [long, lat]
        "location.accuracy": accuracy,
        "location.lastUpdated": new Date(),
        "location.isSharing": isSharing !== undefined ? isSharing : true, // Default to sharing if updating
      },
    },
    { new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, profile.location, "Location updated"));
});

const getNearbyProfiles = asyncHandler(async (req, res) => {
  const { lat, long, radius = 5 } = req.query; // radius in km

  if (!lat || !long) {
    throw new ApiError(400, "Latitude and Longitude are required");
  }

  const radiusInMeters = parseFloat(radius) * 1000;

  const nearbyProfiles = await Profile.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(long), parseFloat(lat)],
        },
        distanceField: "distance",
        maxDistance: radiusInMeters,
        spherical: true,
        query: {
          "location.isSharing": true,
          owner: { $ne: req.user._id }, // Exclude self
        },
      },
    },
    // Privacy: Project only safe fields
    {
      $project: {
        owner: 1,
        fullName: 1,
        avatar: 1,
        bio: 1,
        "currentStatus.message": 1,
        "currentStatus.activityType": 1,
        distance: 1, // in meters
        // Do NOT include location.coordinates
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
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
      $unwind: "$ownerDetails",
    },
    {
      $addFields: {
        owner: "$ownerDetails",
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      nearbyProfiles.map((p) => ({
        ...p,
        distance: Math.round(p.distance) + "m", // Format distance
      })),
      "Nearby profiles fetched",
    ),
  );
});

export {
  getMyProfile,
  updateProfile,
  getUserProfileById,
  updateLocation,
  getNearbyProfiles,
};
