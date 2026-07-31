import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Workshop from "../models/Workshop.js";
import WorkshopReview from "../models/WorkshopReview.js";

import {
  deleteWorkshopMedia,
  uploadWorkshopMediaFromBuffer,
} from "../services/cloudinaryService.js";

const MAX_REVIEW_IMAGES = 5;
const REVIEWABLE_BOOKING_STATUSES = ["checked_in", "completed"];

const normalizeRating = (value) => {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return rating;
};

const normalizeComment = (value) => {
  return String(value ?? "").trim();
};

const parseStringArray = (value, fallback = []) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue) ? parsedValue.map(String) : fallback;
  } catch {
    return fallback;
  }
};

const uploadReviewImages = async (files) => {
  const uploadedImages = [];

  for (const file of files) {
    const result = await uploadWorkshopMediaFromBuffer(file, {
      folder: "wopy/workshop-reviews/images",
      resource_type: "image",

      transformation: [
        {
          width: 1600,
          height: 1600,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    uploadedImages.push({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: "image",
    });
  }

  return uploadedImages;
};

const deleteReviewImages = async (images) => {
  if (!images.length) {
    return;
  }

  await Promise.allSettled(
    images.map((image) =>
      deleteWorkshopMedia(image.publicId, image.resourceType ?? "image"),
    ),
  );
};

const populateReview = async (review) => {
  await review.populate({
    path: "user",
    select: "displayName username avatarUrl",
  });

  return review;
};

const findReviewableBooking = async (workshopId, userId) => {
  return Booking.findOne({
    workshop: workshopId,
    user: userId,
    status: {
      $in: REVIEWABLE_BOOKING_STATUSES,
    },
  })
    .select("_id")
    .sort({
      updatedAt: -1,
    });
};

const syncWorkshopRating = async (workshopId) => {
  const objectId = new mongoose.Types.ObjectId(String(workshopId));

  const [statistics] = await WorkshopReview.aggregate([
    {
      $match: {
        workshop: objectId,
      },
    },

    {
      $group: {
        _id: "$workshop",

        averageRating: {
          $avg: "$rating",
        },

        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  await Workshop.updateOne(
    {
      _id: objectId,
    },

    {
      $set: {
        averageRating: statistics?.averageRating ?? 0,
        reviewCount: statistics?.reviewCount ?? 0,
      },
    },
  );
};

export const getWorkshopReviews = async (req, res) => {
  try {
    const workshopId = req.params.id;

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const numericPage = Number(req.query.page ?? 1);
    const numericLimit = Number(req.query.limit ?? 10);

    const page =
      Number.isInteger(numericPage) && numericPage > 0 ? numericPage : 1;

    const limit =
      Number.isInteger(numericLimit) && numericLimit > 0
        ? Math.min(numericLimit, 20)
        : 10;

    const workshopExists = await Workshop.exists({
      _id: workshopId,
    });

    if (!workshopExists) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    const objectId = new mongoose.Types.ObjectId(workshopId);

    const [reviews, reviewCount, statistics] = await Promise.all([
      WorkshopReview.find({
        workshop: workshopId,
      })
        .populate("user", "displayName username avatarUrl")
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit),

      WorkshopReview.countDocuments({
        workshop: workshopId,
      }),

      WorkshopReview.aggregate([
        {
          $match: {
            workshop: objectId,
          },
        },

        {
          $group: {
            _id: "$rating",

            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let ratingTotal = 0;

    statistics.forEach((item) => {
      distribution[item._id] = item.count;
      ratingTotal += item._id * item.count;
    });

    const averageRating =
      reviewCount > 0 ? Number((ratingTotal / reviewCount).toFixed(1)) : 0;

    return res.status(200).json({
      reviews,
      averageRating,
      reviewCount,
      distribution,
      page,
      totalPages: Math.ceil(reviewCount / limit),
    });
  } catch (error) {
    console.error("Get workshop reviews error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải đánh giá workshop",
    });
  }
};

export const getWorkshopReviewEligibility = async (req, res) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const existingReview = await WorkshopReview.findOne({
      workshop: workshopId,
      user: userId,
    }).populate("user", "displayName username avatarUrl");

    if (existingReview) {
      return res.status(200).json({
        canReview: false,
        reason: "already_reviewed",
        bookingId: existingReview.booking,
        existingReview,
      });
    }

    const completedBooking = await findReviewableBooking(workshopId, userId);

    if (!completedBooking) {
      return res.status(200).json({
        canReview: false,
        reason: "not_completed",
        bookingId: null,
        existingReview: null,
      });
    }

    return res.status(200).json({
      canReview: true,
      reason: "eligible",
      bookingId: completedBooking._id,
      existingReview: null,
    });
  } catch (error) {
    console.error("Get review eligibility error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể kiểm tra quyền đánh giá",
    });
  }
};

export const createWorkshopReview = async (req, res) => {
  let uploadedImages = [];
  let createdReview = null;

  try {
    const workshopId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const rating = normalizeRating(req.body.rating);
    const comment = normalizeComment(req.body.comment);

    if (rating === null) {
      return res.status(400).json({
        message: "Điểm đánh giá phải là số nguyên từ 1 đến 5",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        message: "Nội dung đánh giá không được vượt quá 2000 ký tự",
      });
    }

    const workshopExists = await Workshop.exists({
      _id: workshopId,
    });

    if (!workshopExists) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    const existingReview = await WorkshopReview.exists({
      workshop: workshopId,
      user: userId,
    });

    if (existingReview) {
      return res.status(409).json({
        message: "Bạn đã đánh giá workshop này",
      });
    }

    const completedBooking = await findReviewableBooking(workshopId, userId);

    if (!completedBooking) {
      return res.status(403).json({
        message: "Chỉ người đã hoàn thành workshop mới được đánh giá",
      });
    }

    const files = req.files ?? [];

    if (files.length > MAX_REVIEW_IMAGES) {
      return res.status(400).json({
        message: "Chỉ được tải tối đa 5 hình ảnh",
      });
    }

    uploadedImages = await uploadReviewImages(files);

    createdReview = await WorkshopReview.create({
      workshop: workshopId,
      user: userId,
      booking: completedBooking._id,
      rating,
      comment,
      images: uploadedImages,
    });

    await populateReview(createdReview);

    try {
      await syncWorkshopRating(workshopId);
    } catch (syncError) {
      console.error("Sync workshop rating error:", syncError);
    }

    return res.status(201).json({
      message: "Đánh giá workshop thành công",
      review: createdReview,
    });
  } catch (error) {
    console.error("Create workshop review error:", error);

    if (!createdReview && uploadedImages.length > 0) {
      await deleteReviewImages(uploadedImages);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Bạn đã đánh giá workshop này",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể tạo đánh giá",
    });
  }
};

export const updateWorkshopReview = async (req, res) => {
  let uploadedImages = [];
  let reviewSaved = false;

  try {
    const workshopId = req.params.id;
    const reviewId = req.params.reviewId;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (
      !mongoose.isValidObjectId(workshopId) ||
      !mongoose.isValidObjectId(reviewId)
    ) {
      return res.status(400).json({
        message: "Đánh giá không hợp lệ",
      });
    }

    const review = await WorkshopReview.findOne({
      _id: reviewId,
      workshop: workshopId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa",
      });
    }

    const rating = normalizeRating(req.body.rating);
    const comment = normalizeComment(req.body.comment);

    if (rating === null) {
      return res.status(400).json({
        message: "Điểm đánh giá phải là số nguyên từ 1 đến 5",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        message: "Nội dung đánh giá không được vượt quá 2000 ký tự",
      });
    }

    const keepImagePublicIds = new Set(
      parseStringArray(
        req.body.keepImagePublicIds,
        review.images.map((image) => image.publicId),
      ),
    );

    const keptImages = review.images.filter((image) =>
      keepImagePublicIds.has(image.publicId),
    );

    const removedImages = review.images.filter(
      (image) => !keepImagePublicIds.has(image.publicId),
    );

    const files = req.files ?? [];

    if (keptImages.length + files.length > MAX_REVIEW_IMAGES) {
      return res.status(400).json({
        message: "Mỗi đánh giá chỉ được có tối đa 5 hình ảnh",
      });
    }

    uploadedImages = await uploadReviewImages(files);

    const oldRating = review.rating;

    review.rating = rating;
    review.comment = comment;
    review.images = [...keptImages, ...uploadedImages];

    await review.save();

    reviewSaved = true;

    await populateReview(review);
    await deleteReviewImages(removedImages);

    if (oldRating !== rating) {
      try {
        await syncWorkshopRating(workshopId);
      } catch (syncError) {
        console.error("Sync workshop rating error:", syncError);
      }
    }

    return res.status(200).json({
      message: "Cập nhật đánh giá thành công",
      review,
    });
  } catch (error) {
    console.error("Update workshop review error:", error);

    if (!reviewSaved && uploadedImages.length > 0) {
      await deleteReviewImages(uploadedImages);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể cập nhật đánh giá",
    });
  }
};

export const deleteWorkshopReview = async (req, res) => {
  try {
    const workshopId = req.params.id;
    const reviewId = req.params.reviewId;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (
      !mongoose.isValidObjectId(workshopId) ||
      !mongoose.isValidObjectId(reviewId)
    ) {
      return res.status(400).json({
        message: "Đánh giá không hợp lệ",
      });
    }

    const review = await WorkshopReview.findOne({
      _id: reviewId,
      workshop: workshopId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền xóa",
      });
    }

    const images = [...review.images];

    await review.deleteOne();
    await deleteReviewImages(images);

    try {
      await syncWorkshopRating(workshopId);
    } catch (syncError) {
      console.error("Sync workshop rating error:", syncError);
    }

    return res.status(200).json({
      message: "Đã xóa đánh giá",
    });
  } catch (error) {
    console.error("Delete workshop review error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể xóa đánh giá",
    });
  }
};
