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
    // We can add location here later for the "Human OS" features
    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const Profile = mongoose.model("Profile", profileSchema);
