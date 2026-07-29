import express from "express";

import {
  checkInBooking,
  createPromotionCampaign,
  getHostBookings,
  getHostDashboard,
  getHostRevenue,
  getHostWorkshops,
  getPromotionCampaigns,
  getPromotionPackages,
} from "../controllers/hostController.js";

import { protectedRoute, isHost } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute);
router.use(isHost);

router.get("/dashboard", getHostDashboard);
router.get("/workshops", getHostWorkshops);
router.get("/bookings", getHostBookings);
router.post("/check-in", checkInBooking);
router.get("/revenue", getHostRevenue);

router.get("/promotions/packages", getPromotionPackages);

router.get("/promotions", getPromotionCampaigns);

router.post("/promotions", createPromotionCampaign);

export default router;
