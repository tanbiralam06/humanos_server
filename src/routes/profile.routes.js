import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  getMyProfile,
  updateProfile,
  getUserProfileById,
  updateLocation,
  getNearbyProfiles,
} from "../controllers/profile.controllers.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT to all routes in this file

router.route("/me").get(getMyProfile);
router.route("/update").patch(updateProfile);
router.route("/u/:userId").get(getUserProfileById);

// Geolocation & Discovery Routes
router.route("/location").patch(updateLocation);
router.route("/nearby").get(getNearbyProfiles);

export default router;
