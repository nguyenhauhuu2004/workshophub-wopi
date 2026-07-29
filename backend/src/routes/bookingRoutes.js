import express from "express";

import {
  //   cancelMyBooking,
  createBooking,
  //   getHostBookings,
  //   getMyBookings,
} from "../controllers/bookingController.js";

import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/", createBooking);

// router.get("/me", getMyBookings);

// router.patch("/:id/cancel", cancelMyBooking);

// router.get("/host/list", getHostBookings);

export default router;
