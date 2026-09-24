import express from "express";

import {
  createDiscount,
  getHostDiscounts,
  toggleDiscount,
  deleteDiscount,
  validateDiscount,
} from "../controllers/discountController.js";

import { isHost } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route kiểm tra mã giảm giá cho user khi đặt chỗ (đã qua protectedRoute ở server.js)
router.post("/validate", validateDiscount);

// Các route quản lý dành riêng cho Host
router.use(isHost);

router.get("/", getHostDiscounts);
router.post("/", createDiscount);
router.patch("/:id/toggle", toggleDiscount);
router.delete("/:id", deleteDiscount);

export default router;
