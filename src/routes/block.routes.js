import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  toggleBlockUser,
  getBlockedUsers,
} from "../controllers/block.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/:userId").post(toggleBlockUser);
router.route("/").get(getBlockedUsers);

export default router;
