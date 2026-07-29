import mongoose from "mongoose";

const promotionCampaignSchema =
  new mongoose.Schema(
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

      packageCode: {
        type: String,
        required: true,
      },

      packageName: {
        type: String,
        required: true,
      },

      placement: {
        type: String,
        enum: [
          "homepage",
          "search",
          "category",
          "location",
          "homepage_search",
        ],
        required: true,
        index: true,
      },

      durationDays: {
        type: Number,
        required: true,
        min: 1,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
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
        enum: [
          "pending_payment",
          "scheduled",
          "active",
          "completed",
          "cancelled",
          "rejected",
        ],
        default: "pending_payment",
        index: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "unpaid",
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "unpaid",
      },

      paymentReference: String,

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

      attributedRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },

      rejectionReason: String,
    },
    {
      timestamps: true,
    },
  );

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
