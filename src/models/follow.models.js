import mongoose, { Schema } from "mongoose";

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true }); // Prevent duplicate follows

export const Follow = mongoose.model("Follow", followSchema);
