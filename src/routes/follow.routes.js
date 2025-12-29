import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  toggleFollow,
  getFollowStatus,
  getFollowingList,
} from "../controllers/follow.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/c/:userId").post(toggleFollow);
router.route("/s/:userId").get(getFollowStatus);
router.route("/list/:userId").get(getFollowingList);

export default router;
