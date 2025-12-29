import { Router } from "express";
import {
  createChatroom,
  getAllChatrooms,
  getChatroomDetails,
  joinChatroom,
  leaveChatroom,
  getChatroomMessages,
} from "../controllers/chatroom.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

router.route("/").post(createChatroom).get(getAllChatrooms);

router.route("/:roomId").get(getChatroomDetails);

router.route("/:roomId/join").post(joinChatroom);

router.route("/:roomId/leave").post(leaveChatroom);

router.route("/:roomId/messages").get(getChatroomMessages);

export default router;
