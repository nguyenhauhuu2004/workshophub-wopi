import mongoose from "mongoose";

import Workshop from "../models/Workshop.js";
import WorkshopReview from "../models/WorkshopReview.js";

const getReviewSummary = async (workshopId) => {
  const objectId = new mongoose.Types.ObjectId(workshopId);

  const [summary] = await WorkshopReview.aggregate([
    {
      $match: {
        workshop: objectId,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating",
        },
        totalReviews: {
          $sum: 1,
        },
        ratings: {
          $push: "$rating",
        },
      },
    },
  ]);

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const rating of summary?.ratings ?? []) {
    distribution[rating] += 1;
  }

  return {
    averageRating: Math.round((summary?.averageRating ?? 0) * 10) / 10,

    totalReviews: summary?.totalReviews ?? 0,

    distribution,
  };
};

export const getWorkshopReviews = async (req, res) => {
  try {
    // Nếu muốn người đặt mới có thể đánh giá
    // const booking = await Booking.findOne({
    //   workshop: workshopId,
    //   user: userId,
    //   status: {
    //     $in: ["confirmed", "completed"],
    //   },
    // });

    // if (!booking) {
    //   return res.status(403).json({
    //     message: "Chỉ người đã đăng ký workshop mới được đánh giá",
    //   });
    // }

    const workshopId = req.params.id;

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop ID không hợp lệ",
      });
    }

    const reviews = await WorkshopReview.find({
      workshop: workshopId,
    })
      .populate("user", "displayName avatarUrl")
      .sort({
        createdAt: -1,
      });

    const summary = await getReviewSummary(workshopId);

    return res.status(200).json({
      reviews,
      summary,
    });
  } catch (error) {
    console.error("Get workshop reviews error:", error);

    return res.status(500).json({
      message: "Không thể tải đánh giá",
    });
  }
};

export const createWorkshopReview = async (req, res) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user?._id;

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment ?? "").trim();

    if (!userId) {
      return res.status(401).json({
        message: "Chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop ID không hợp lệ",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Số sao phải từ 1 đến 5",
      });
    }

    if (comment.length < 5 || comment.length > 1000) {
      return res.status(400).json({
        message: "Nội dung đánh giá phải từ 5 đến 1000 ký tự",
      });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    if (String(workshop.host) === String(userId)) {
      return res.status(400).json({
        message: "Người tổ chức không thể tự đánh giá workshop",
      });
    }

    const review = await WorkshopReview.create({
      workshop: workshopId,
      user: userId,
      rating,
      comment,
    });

    const summary = await getReviewSummary(workshopId);

    await Workshop.findByIdAndUpdate(workshopId, {
      averageRating: summary.averageRating,

      reviewCount: summary.totalReviews,
    });

    await review.populate("user", "displayName avatarUrl");

    return res.status(201).json({
      message: "Đánh giá thành công",
      review,
      summary,
    });
  } catch (error) {
    console.error("Create workshop review error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Bạn đã đánh giá workshop này",
      });
    }

    return res.status(500).json({
      message: "Không thể gửi đánh giá",
    });
  }
};
