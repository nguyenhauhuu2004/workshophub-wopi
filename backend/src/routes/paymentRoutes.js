import express from "express";
import {
  createOrGetPayment,
  getPaymentById,
  getPaymentByBookingId,
  handlePaymentWebhook,
  simulatePaymentSuccess,
  manualConfirmPayment,
  cancelPayment,
} from "../controllers/paymentController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Webhook endpoint (Public - không qua protectedRoute)
export const webhookRouter = express.Router();
webhookRouter.post("/", handlePaymentWebhook);

// Protected routes cho user & host
router.post("/create", protectedRoute, createOrGetPayment);
router.get("/booking/:bookingId", protectedRoute, getPaymentByBookingId);
router.get("/:id", protectedRoute, getPaymentById);
router.post("/:id/cancel", protectedRoute, cancelPayment);
router.post("/:id/manual-confirm", protectedRoute, manualConfirmPayment);
router.post("/simulate-success", protectedRoute, simulatePaymentSuccess);

export default router;
