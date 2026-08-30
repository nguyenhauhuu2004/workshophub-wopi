import mongoose from "mongoose";

const promotionCampaignSchema = new mongoose.Schema(
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

    promotionPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionPackage",
      required: true,
    },

    packageSnapshot: {
      code: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      durationDays: {
        type: Number,
        required: true,
        min: 1,
      },

      placement: {
        type: String,
        enum: ["homepage", "search_top", "category_top"],
        required: true,
      },
    },

    startAt: {
      type: Date,
      required: true,
      index: true,
    },

    endAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      required: true,
      index: true,
    },

    paymentProvider: {
      type: String,
      enum: ["mock"],
      default: "mock",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },

    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },

    attributedBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

promotionCampaignSchema.index({
  host: 1,
  createdAt: -1,
});

promotionCampaignSchema.index({
  workshop: 1,
  status: 1,
  startAt: 1,
  endAt: 1,
});

const PromotionCampaign = mongoose.model(
  "PromotionCampaign",
  promotionCampaignSchema,
);

export default PromotionCampaign;
