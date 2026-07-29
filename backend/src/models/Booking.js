import crypto from "node:crypto";
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
      index: true,
    },

    // Lưu host trực tiếp để truy vấn dashboard và phân quyền nhanh.
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Snapshot tên/ngày/giờ của lịch tại thời điểm đặt.
    sessionLabel: {
      type: String,
      required: true,
      trim: true,
    },

    sessionSnapshot: {
      date: {
        type: String,
        required: true,
      },

      time: {
        type: String,
        required: true,
      },
    },

    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },

    attendeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    hostNetAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "partially_refunded",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "no_show",
        "refunded",
      ],
      default: "pending_payment",
      index: true,
    },

    paidAt: Date,

    // QR chứa token gốc; DB chỉ lưu hash.
    qrTokenHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    checkedInAt: Date,

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    checkInMethod: {
      type: String,
      enum: ["qr", "manual"],
    },

    payoutStatus: {
      type: String,
      enum: ["pending", "available", "paid", "held"],
      default: "pending",
      index: true,
    },

    payoutAt: Date,

    promotionCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionCampaign",
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({
  host: 1,
  createdAt: -1,
});

bookingSchema.index({
  workshop: 1,
  sessionId: 1,
  status: 1,
});

bookingSchema.statics.hashTicketCode = function (ticketCode) {
  return crypto.createHash("sha256").update(ticketCode).digest("hex");
};

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
