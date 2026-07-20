import express from "express";
import { authMe, uploadAvatar } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.get("/me", authMe);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

export default router;
