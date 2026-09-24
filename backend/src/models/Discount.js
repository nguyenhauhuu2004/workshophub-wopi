import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
      index: true,
    },

    /*
     * "code"   → Tạo mã giảm giá (khách nhập mã khi thanh toán)
     * "direct" → Giảm giá trực tiếp (hiển thị trên card & tự động áp dụng)
     */
    applyType: {
      type: String,
      enum: ["code", "direct"],
      default: "code",
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    /*
     * "percentage" → giảm theo phần trăm
     * "fixed"      → giảm theo số tiền cố định
     */
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    /*
     * Nếu type = "percentage" → value = 10 nghĩa là giảm 10%
     * Nếu type = "fixed"      → value = 50000 nghĩa là giảm 50.000đ
     */
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(val) {
          if (this.type === "percentage") return val > 0 && val <= 100;
          return val > 0;
        },
        message: "Giá trị giảm giá không hợp lệ",
      },
    },

    /*
     * Số lượng mã giảm giá có thể sử dụng.
     * null = không giới hạn.
     */
    maxUsage: {
      type: Number,
      default: null,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* Một workshop không được có 2 mã giảm giá cùng code */
discountSchema.index({ workshop: 1, code: 1 }, { unique: true });

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
