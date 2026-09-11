import express from "express";
import {
  authMe,
  uploadAvatar,
  updateProfile,
  saveDefaultAttendee,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.patch("/profile", protectedRoute, updateProfile);
router.patch("/me/default-attendee", protectedRoute, saveDefaultAttendee);

export default router;

