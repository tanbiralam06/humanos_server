import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  toggleFollow,
  getFollowStatus,
} from "../controllers/follow.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/c/:userId").post(toggleFollow);
router.route("/s/:userId").get(getFollowStatus);

export default router;
