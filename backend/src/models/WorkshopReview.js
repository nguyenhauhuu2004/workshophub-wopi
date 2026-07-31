import mongoose from "mongoose";

const reviewImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["image"],
      default: "image",
    },
  },
  {
    _id: false,
  },
);

const workshopReviewSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Điểm đánh giá phải là số nguyên từ 1 đến 5",
      },
    },

    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    images: {
      type: [reviewImageSchema],
      default: [],

      validate: {
        validator(value) {
          return value.length <= 5;
        },

        message: "Mỗi đánh giá chỉ được có tối đa 5 hình ảnh",
      },
    },
  },
  {
    timestamps: true,
  },
);

workshopReviewSchema.index(
  {
    workshop: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

workshopReviewSchema.index({
  workshop: 1,
  createdAt: -1,
});

const WorkshopReview = mongoose.model("WorkshopReview", workshopReviewSchema);

export default WorkshopReview;
