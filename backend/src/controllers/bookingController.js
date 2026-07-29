import crypto from "node:crypto";
import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Workshop from "../models/Workshop.js";

const createBookingCode = () => {
  const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `BK-${Date.now()}-${randomCode}`;
};

export const createBooking = async (req, res) => {
  try {
    const userId = req.user?._id;

    const { workshopId, sessionId, quantity } = req.body;

    const normalizedQuantity = Number(quantity);

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (
      !mongoose.isValidObjectId(workshopId) ||
      !mongoose.isValidObjectId(sessionId)
    ) {
      return res.status(400).json({
        message: "Workshop hoặc lịch workshop không hợp lệ",
      });
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      return res.status(400).json({
        message: "Số lượng người phải là số nguyên lớn hơn 0",
      });
    }

    const workshop = await Workshop.findOne({
      _id: workshopId,
      status: "published",
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    if (String(workshop.host) === String(userId)) {
      return res.status(400).json({
        message: "Bạn không thể tự đặt workshop của mình",
      });
    }

    // Dùng sessionId từ req.body, không dùng booking.sessionId.
    const selectedSession = workshop.schedules.id(sessionId);

    if (!selectedSession) {
      return res.status(404).json({
        message: "Không tìm thấy lịch workshop",
      });
    }

    if (normalizedQuantity > selectedSession.spotsLeft) {
      return res.status(409).json({
        message: `Lịch này chỉ còn ${selectedSession.spotsLeft} chỗ`,
      });
    }

    const unitPrice = Number(workshop.price);

    const subtotal = unitPrice * normalizedQuantity;

    const taxAmount = Math.round(subtotal * 0.08);

    const grossAmount = subtotal + taxAmount;

    const platformFee = Math.round(grossAmount * 0.05);

    const hostNetAmount = grossAmount - platformFee;

    const attendeeName =
      req.user.displayName || req.user.username || "Khách hàng";

    const attendeeEmail = req.user.email || `${userId}@temporary.local`;

    // Trừ chỗ trước khi tạo booking.
    selectedSession.spotsLeft -= normalizedQuantity;

    await workshop.save();

    let createdBooking;

    try {
      createdBooking = await Booking.create({
        bookingCode: createBookingCode(),

        workshop: workshop._id,
        host: workshop.host,
        user: userId,

        sessionId: selectedSession._id,
        sessionLabel: `${selectedSession.date} · ${selectedSession.time}`,

        sessionSnapshot: {
          date: selectedSession.date,
          time: selectedSession.time,
        },

        attendeeName,
        attendeeEmail,

        quantity: normalizedQuantity,

        unitPrice,
        subtotal,
        taxAmount,
        totalAmount,

        grossAmount: totalAmount,

        platformFee,
        hostNetAmount,

        paymentMethod: "pay_at_venue",
        paymentStatus: "unpaid",
        status: "confirmed",
      });
    } catch (bookingError) {
      // Tạo booking thất bại thì trả lại chỗ.
      selectedSession.spotsLeft += normalizedQuantity;

      await workshop.save();

      throw bookingError;
    }

    await createdBooking.populate([
      {
        path: "workshop",
        select: "title thumbnail category location",
      },
      {
        path: "host",
        select: "displayName username avatarUrl",
      },
    ]);

    return res.status(201).json({
      message: "Đặt chỗ thành công",
      booking: createdBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Dữ liệu booking không hợp lệ",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Mã booking bị trùng",
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể tạo booking",
    });
  }
};
