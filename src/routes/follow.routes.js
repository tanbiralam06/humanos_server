import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  toggleFollow,
  getFollowStatus,
  getFollowingList,
  getFollowersList,
  removeFollower,
} from "../controllers/follow.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/c/:userId").post(toggleFollow);
router.route("/s/:userId").get(getFollowStatus);
router.route("/list/:userId").get(getFollowingList);
router.route("/followers/:userId").get(getFollowersList);
router.route("/r/:followerId").delete(removeFollower);

export default router;
