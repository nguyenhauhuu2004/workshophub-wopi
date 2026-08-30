import express from "express";

import {
  getHostBookings,
  getHostDashboard,
  getHostWorkshops,
} from "../controllers/hostController.js";

import { isHost, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute, isHost);

router.get("/dashboard", getHostDashboard);

router.get("/workshops", getHostWorkshops);

router.get("/bookings", getHostBookings);

export default router;
