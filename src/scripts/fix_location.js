import mongoose from "mongoose";
import dotenv from "dotenv";
import { Profile } from "../models/profile.models.js";

dotenv.config({ path: "./.env" });

const fixProfiles = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/humanos";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // We must bypass the Mongoose schema validation to find the "broken" documents
    // Actually, we can just use updateMany with strict: false or generic object
    // Or just find all and overwrite them

    // Find profiles where location is a string (if possible with pure mongo query)
    // $type: 2 is string

    const result = await Profile.collection.updateMany(
      { location: { $type: "string" } },
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [0, 0],
            lastUpdated: new Date(),
            isSharing: false,
          },
        },
      },
    );

    console.log(`Updated ${result.modifiedCount} profiles.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
    process.exit(0);
  }
};

fixProfiles();
