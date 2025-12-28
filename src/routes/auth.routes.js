import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controllers.js";

const router = Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
export default router;
