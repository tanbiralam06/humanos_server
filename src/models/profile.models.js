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
    // --- Matching Algorithm Fields ---
    birthday: {
      type: Date,
      // Required for age calculation (Age = Date.now() - birthday)
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
    },
    interests: {
      type: [String],
      // Recommended: 3-5 tags
    },
    intent: {
      type: String,
      enum: [
        "Dating",
        "Friendship",
        "Networking",
        "Casual",
        "Something Serious",
      ],
    },
    occupation: {
      type: String,
      trim: true,
    },
    educationLevel: {
      type: String,
      enum: [
        "High School",
        "Bachelor",
        "Master",
        "Doctorate",
        "Trade School",
        "Other",
      ],
    },
    languages: {
      type: [String],
    },
    prompts: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Profile = mongoose.model("Profile", profileSchema);
