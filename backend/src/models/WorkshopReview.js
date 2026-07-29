import mongoose from "mongoose";

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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
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

const WorkshopReview = mongoose.model("WorkshopReview", workshopReviewSchema);

export default WorkshopReview;
