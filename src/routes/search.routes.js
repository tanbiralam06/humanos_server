import { Router } from "express";
import { universalSearch } from "../controllers/search.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

router.route("/").get(universalSearch);

export default router;
