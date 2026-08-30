import crypto from "node:crypto";
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
     * Đây là _id của schedule nằm trong:
     *
     * workshop.schedules
     *
     * Vì vậy workshopScheduleSchema phải được phép tạo _id.
     */
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    /*
     * Chuỗi dùng để hiển thị nhanh.
     *
     * Ví dụ:
     * "08:00, Thứ Bảy 20/09/2026"
     */
    sessionLabel: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Snapshot lịch tại thời điểm đặt chỗ.
     *
     * Không lấy lại dữ liệu từ Workshop khi hiển thị booking,
     * vì host có thể chỉnh sửa lịch sau khi người dùng đặt.
     */
    sessionSnapshot: {
      startAt: {
        type: Date,
        required: true,
      },

      seatsTotal: {
        type: Number,
        required: true,
        min: 1,
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

    /*
     * Toàn bộ dữ liệu tiền phải được backend tự tính.
     * Không lấy trực tiếp từ request body của frontend.
     */
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

    paidAt: {
      type: Date,
      default: null,
    },

    /*
     * QR trả cho người dùng chứa ticketCode gốc.
     * Database chỉ lưu SHA-256 hash.
     */
    qrTokenHash: {
      type: String,
      unique: true,
      sparse: true,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    checkInMethod: {
      type: String,
      enum: ["qr", "manual"],
      default: null,
    },

    payoutStatus: {
      type: String,
      enum: ["pending", "available", "paid", "held"],
      default: "pending",
      index: true,
    },

    payoutAt: {
      type: Date,
      default: null,
    },

    promotionCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionCampaign",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Dashboard của host:
 * lấy booking mới nhất theo host.
 */
bookingSchema.index({
  host: 1,
  createdAt: -1,
});

/*
 * Lịch sử booking của người dùng.
 */
bookingSchema.index({
  user: 1,
  createdAt: -1,
});

/*
 * Truy vấn booking theo workshop, schedule và trạng thái.
 */
bookingSchema.index({
  workshop: 1,
  sessionId: 1,
  status: 1,
});

/*
 * Hash ticket code trước khi lưu vào qrTokenHash.
 */
bookingSchema.statics.hashTicketCode = function (ticketCode) {
  return crypto.createHash("sha256").update(String(ticketCode)).digest("hex");
};

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
