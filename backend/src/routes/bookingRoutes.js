import express from "express";

import {
  checkInBooking,
  createBooking,
  getMyBookings,
} from "../controllers/bookingController.js";

import { isHost, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protectedRoute, createBooking);

router.get("/me", protectedRoute, getMyBookings);

router.post("/check-in", protectedRoute, isHost, checkInBooking);

export default router;
