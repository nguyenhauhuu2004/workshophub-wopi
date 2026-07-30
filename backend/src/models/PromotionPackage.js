import mongoose from "mongoose";

const promotionPackageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
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

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const PromotionPackage = mongoose.model(
  "PromotionPackage",
  promotionPackageSchema,
);

export default PromotionPackage;
