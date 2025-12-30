import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One profile per user
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: "https://placehold.co/200x200",
        localPath: "",
      },
    },
    bio: {
      type: String,
      default: "",
    },
    locationName: {
      type: String,
      default: "",
    },
    // Human OS: Location & Context Layer
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      accuracy: {
        type: Number, // GPS accuracy in meters
      },
      isSharing: {
        type: Boolean,
        default: false, // Privacy first: default off
      },
    },
    // Human OS: Real-time Status
    currentStatus: {
      message: {
        type: String,
        trim: true,
        maxLength: 50,
      },
      activityType: {
        type: String,
        enum: ["coffee", "cowork", "walk", "chat", "none"],
        default: "none",
      },
      expiresAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const Profile = mongoose.model("Profile", profileSchema);
