import crypto from "node:crypto";
import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Workshop from "../models/Workshop.js";

const TAX_RATE = 0.08;
const PLATFORM_FEE_RATE = 0.05;

const createBookingCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `BK-${timestamp}-${randomCode}`;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const createSessionLabel = (startAt) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "Thời gian lịch workshop không hợp lệ");
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const createBooking = async (req, res) => {
  const mongoSession = await mongoose.startSession();

  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const { workshopId, sessionId, quantity } = req.body;

    if (
      !mongoose.isValidObjectId(workshopId) ||
      !mongoose.isValidObjectId(sessionId)
    ) {
      return res.status(400).json({
        message: "Workshop hoặc lịch workshop không hợp lệ",
      });
    }

    const normalizedQuantity = Number(quantity);

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      return res.status(400).json({
        message: "Số lượng người phải là số nguyên lớn hơn 0",
      });
    }

    /*
     * Kiểm tra workshop và schedule
     * trước khi bắt đầu transaction.
     */
    const existingWorkshop = await Workshop.findOne({
      _id: workshopId,
      status: "published",
    }).select("host price schedules");

    if (!existingWorkshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    if (String(existingWorkshop.host) === String(userId)) {
      return res.status(400).json({
        message: "Bạn không thể tự đặt workshop của mình",
      });
    }

    const existingSchedule = existingWorkshop.schedules.id(sessionId);

    if (!existingSchedule) {
      return res.status(404).json({
        message: "Không tìm thấy lịch workshop",
      });
    }

    if (normalizedQuantity > existingSchedule.spotsLeft) {
      return res.status(409).json({
        message: `Lịch này chỉ còn ${existingSchedule.spotsLeft} chỗ`,
      });
    }

    const startAt = new Date(existingSchedule.startAt);

    if (Number.isNaN(startAt.getTime())) {
      return res.status(400).json({
        message: "Thời gian lịch workshop không hợp lệ",
      });
    }

    if (startAt.getTime() <= Date.now()) {
      return res.status(409).json({
        message: "Lịch workshop này đã diễn ra",
      });
    }

    const attendeeName =
      req.user.displayName || req.user.username || "Khách hàng";

    const attendeeEmail = req.user.email;

    if (!attendeeEmail) {
      return res.status(400).json({
        message: "Tài khoản chưa có email để đặt chỗ",
      });
    }

    let createdBooking = null;

    await mongoSession.withTransaction(async () => {
      /*
       * Giảm spotsLeft bằng một câu lệnh
       * nguyên tử.
       *
       * Điều kiện $gte ngăn overbooking
       * khi nhiều người đặt cùng lúc.
       */
      const updatedWorkshop = await Workshop.findOneAndUpdate(
        {
          _id: workshopId,
          status: "published",

          host: {
            $ne: userId,
          },

          schedules: {
            $elemMatch: {
              _id: sessionId,

              spotsLeft: {
                $gte: normalizedQuantity,
              },
            },
          },
        },
        {
          $inc: {
            "schedules.$.spotsLeft": -normalizedQuantity,
          },
        },
        {
          returnDocument: "after",
          session: mongoSession,
        },
      );

      if (!updatedWorkshop) {
        throw createHttpError(409, "Lịch workshop không còn đủ chỗ");
      }

      const selectedSession = updatedWorkshop.schedules.id(sessionId);

      if (!selectedSession) {
        throw createHttpError(404, "Không tìm thấy lịch workshop");
      }

      const unitPrice = Number(updatedWorkshop.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw createHttpError(400, "Giá workshop không hợp lệ");
      }

      const subtotal = unitPrice * normalizedQuantity;

      const taxAmount = Math.round(subtotal * TAX_RATE);

      const discountAmount = 0;

      const grossAmount = subtotal - discountAmount + taxAmount;

      /*
       * Phí nền tảng tính trên tiền workshop,
       * không tính trên thuế.
       */
      const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);

      const hostNetAmount = subtotal - discountAmount - platformFee;

      const bookings = await Booking.create(
        [
          {
            bookingCode: createBookingCode(),

            workshop: updatedWorkshop._id,

            host: updatedWorkshop.host,

            user: userId,

            sessionId: selectedSession._id,

            sessionLabel: createSessionLabel(selectedSession.startAt),

            sessionSnapshot: {
              startAt: selectedSession.startAt,

              seatsTotal: selectedSession.seatsTotal,
            },

            attendeeName,
            attendeeEmail,

            quantity: normalizedQuantity,

            unitPrice,
            subtotal,
            discountAmount,
            grossAmount,

            refundAmount: 0,

            platformFee,
            hostNetAmount,

            paymentStatus: "unpaid",

            /*
             * Booking được xác nhận ngay
             * vì hiện tại thanh toán tại địa điểm.
             */
            status: "confirmed",

            payoutStatus: "pending",
          },
        ],
        {
          session: mongoSession,
        },
      );

      createdBooking = bookings[0];
    });

    if (!createdBooking) {
      throw new Error("Không thể tạo booking");
    }

    /*
     * Transaction đã hoàn thành nên populate
     * bên ngoài transaction.
     */
    await createdBooking.populate([
      {
        path: "workshop",
        select: "title thumbnail categories location price duration",
      },
      {
        path: "host",
        select: "displayName username avatarUrl",
      },
      {
        path: "user",
        select: "displayName username avatarUrl email",
      },
    ]);

    return res.status(201).json({
      message: "Đặt chỗ thành công",

      booking: createdBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

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
        message: "Mã booking bị trùng, vui lòng thử lại",
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể tạo booking",
    });
  } finally {
    await mongoSession.endSession();
  }
};

const BOOKING_STATUSES = new Set([
  "pending_payment",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
  "refunded",
]);

const parsePositiveInteger = (value, fallback) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
};

const normalizeBookingCode = (value) => {
  const rawValue = String(value ?? "").trim();

  if (rawValue.startsWith("WOPY_CHECKIN:")) {
    return rawValue.slice("WOPY_CHECKIN:".length).trim().toUpperCase();
  }

  return rawValue.toUpperCase();
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const page = parsePositiveInteger(req.query.page, 1);

    const limit = Math.min(parsePositiveInteger(req.query.limit, 12), 50);

    const status = String(req.query.status ?? "").trim();

    if (status && !BOOKING_STATUSES.has(status)) {
      return res.status(400).json({
        message: "Trạng thái booking không hợp lệ",
      });
    }

    const filter = {
      user: userId,
    };

    if (status) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .select("-qrTokenHash")
        .populate({
          path: "workshop",

          select: "title thumbnail categories location price duration status",
        })
        .populate({
          path: "host",

          select: "displayName username avatarUrl",
        })
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit),

      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      bookings,
      total,
      page,

      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải danh sách booking",
    });
  }
};

export const checkInBooking = async (req, res) => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const rawCode = req.body.qrContent ?? req.body.bookingCode;

    const bookingCode = normalizeBookingCode(rawCode);

    if (!bookingCode) {
      return res.status(400).json({
        message: "Thiếu mã check-in",
      });
    }

    const requestedMethod = req.body.method;

    const checkInMethod =
      requestedMethod ??
      (String(rawCode).startsWith("WOPY_CHECKIN:") ? "qr" : "manual");

    if (checkInMethod !== "qr" && checkInMethod !== "manual") {
      return res.status(400).json({
        message: "Phương thức check-in không hợp lệ",
      });
    }

    /*
     * Chỉ host sở hữu booking mới
     * tìm thấy booking này.
     */
    const existingBooking = await Booking.findOne({
      bookingCode,
      host: hostId,
    }).select("status paymentStatus checkedInAt paidAt");

    if (!existingBooking) {
      return res.status(404).json({
        message: "Không tìm thấy booking hoặc bạn không có quyền check-in",
      });
    }

    /*
     * Cho phép gọi lại endpoint mà không
     * check-in hai lần.
     */
    if (existingBooking.status === "checked_in") {
      await existingBooking.populate([
        {
          path: "workshop",

          select: "title thumbnail categories location",
        },
        {
          path: "user",

          select: "displayName username avatarUrl email",
        },
      ]);

      return res.status(200).json({
        message: "Booking này đã được check-in trước đó",

        booking: existingBooking,

        alreadyCheckedIn: true,
      });
    }

    if (existingBooking.status !== "confirmed") {
      return res.status(409).json({
        message: `Không thể check-in booking có trạng thái ${existingBooking.status}`,
      });
    }

    const now = new Date();

    /*
     * Hiện tại booking thanh toán tại địa điểm,
     * nên check-in đồng thời xác nhận đã thanh toán.
     */
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: existingBooking._id,

        host: hostId,

        status: "confirmed",
      },
      {
        $set: {
          status: "checked_in",

          checkedInAt: now,

          checkedInBy: hostId,

          checkInMethod,

          paymentStatus: "paid",

          paidAt: existingBooking.paidAt ?? now,
        },
      },
      {
        returnDocument: "after",

        runValidators: true,
      },
    );

    if (!updatedBooking) {
      return res.status(409).json({
        message: "Booking đã được cập nhật bởi một yêu cầu khác",
      });
    }

    await updatedBooking.populate([
      {
        path: "workshop",

        select: "title thumbnail categories location",
      },
      {
        path: "user",

        select: "displayName username avatarUrl email",
      },
      {
        path: "host",

        select: "displayName username avatarUrl",
      },
      {
        path: "checkedInBy",

        select: "displayName username avatarUrl",
      },
    ]);

    return res.status(200).json({
      message: "Check-in thành công",

      booking: updatedBooking,

      alreadyCheckedIn: false,
    });
  } catch (error) {
    console.error("Check-in booking error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể check-in booking",
    });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    const bookingId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "Booking không hợp lệ",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      host: userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy booking hoặc bạn không có quyền xử lý",
      });
    }

    if (booking.status === "completed") {
      return res.status(200).json({
        message: "Booking đã hoàn thành trước đó",
        booking,
      });
    }

    if (booking.status !== "checked_in") {
      return res.status(409).json({
        message: "Chỉ booking đã check-in mới có thể hoàn thành",
      });
    }

    booking.status = "completed";

    await booking.save();

    return res.status(200).json({
      message: "Đã xác nhận hoàn thành workshop",
      booking,
    });
  } catch (error) {
    console.error("Complete booking error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể hoàn thành booking",
    });
  }
};
