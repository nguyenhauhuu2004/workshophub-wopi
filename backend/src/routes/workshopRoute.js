import express from "express";
import { uploadWorkshopMedia } from "../controllers/workshopController.js";
import { uploadWorkshopMedia } from "../middlewares/uploadWorkshopMediaMiddleware.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/upload-media",
  protectedRoute,
  uploadWorkshopMedia.array("files", 10),
  uploadWorkshopMedia,
);

export default router;
