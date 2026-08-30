import express from "express";

import {
  addWorkshopSchedule,
  createWorkshop,
  deleteMediaController,
  getGoongPlaceDetail,
  getNearbyWorkshops,
  getWorkshopById,
  getWorkshops,
  reverseGoongGeocode,
  searchGoongPlaces,
  updateWorkshop,
} from "../controllers/workshopController.js";

import { isHost, protectedRoute } from "../middlewares/authMiddleware.js";

import { workshopUpload } from "../middlewares/workshopUploadMiddleware.js";

import {
  createWorkshopReview,
  deleteWorkshopReview,
  getWorkshopReviewEligibility,
  getWorkshopReviews,
  updateWorkshopReview,
} from "../controllers/workshopReviewController.js";

import { uploadWorkshopReviewImages } from "../middlewares/workshopReviewUploadMiddleware.js";

const router = express.Router();

/*
 * Goong Map API.
 */
router.get("/goong/autocomplete", searchGoongPlaces);

router.get("/goong/place-detail", getGoongPlaceDetail);

router.get("/goong/reverse-geocode", reverseGoongGeocode);

/*
 * Route cố định đặt trước /:id.
 */
router.get("/nearby", getNearbyWorkshops);

router.delete("/media", protectedRoute, deleteMediaController);

/*
 * Tạo workshop.
 */
router.post(
  "/",
  protectedRoute,
  isHost,

  workshopUpload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },

    {
      name: "gallery",
      maxCount: 10,
    },

    {
      name: "video",
      maxCount: 1,
    },
  ]),

  createWorkshop,
);

router.get(
  "/:id/reviews/eligibility",
  protectedRoute,
  getWorkshopReviewEligibility,
);

router.get("/:id/reviews", getWorkshopReviews);

router.post(
  "/:id/reviews",
  protectedRoute,
  uploadWorkshopReviewImages,
  createWorkshopReview,
);

router.patch(
  "/:id/reviews/:reviewId",
  protectedRoute,
  uploadWorkshopReviewImages,
  updateWorkshopReview,
);

router.delete("/:id/reviews/:reviewId", protectedRoute, deleteWorkshopReview);

/*
 * Thêm lịch mới.
 */
router.post("/:id/schedules", protectedRoute, isHost, addWorkshopSchedule);

/*
 * Chỉnh sửa workshop.
 */
router.patch("/:id", protectedRoute, isHost, updateWorkshop);

/*
 * Danh sách và chi tiết.
 */
router.get("/", getWorkshops);

router.get("/:id", getWorkshopById);

export default router;
