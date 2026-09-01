import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "VND",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "cancelled"],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["vietqr"],
      default: "vietqr",
    },

    /*
     * Nội dung chuyển khoản duy nhất dùng để khớp giao dịch VietQR.
     * Ví dụ: "WOPI 8F9A2B"
     */
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    bankAccount: {
      bankBin: {
        type: String,
        required: true,
        trim: true,
      },
      bankName: {
        type: String,
        default: "",
        trim: true,
      },
      accountNo: {
        type: String,
        required: true,
        trim: true,
      },
      accountName: {
        type: String,
        required: true,
        trim: true,
      },
    },

    qrCode: {
      type: String,
      default: "",
    },

    qrDataURL: {
      type: String,
      default: "",
    },

    deeplink: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    manualConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    manualConfirmNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
