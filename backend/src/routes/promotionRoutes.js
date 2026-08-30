import express from "express";

import {
  createPromotionCampaign,
  getMyPromotionCampaigns,
  getPromotionPackages,
} from "../controllers/promotionController.js";

import { isHost, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute, isHost);

router.get("/packages", getPromotionPackages);

router.get("/campaigns", getMyPromotionCampaigns);

router.post("/campaigns", createPromotionCampaign);

export default router;
