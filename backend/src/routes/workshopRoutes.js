import express from "express";

import {
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

import { protectedRoute, isHost } from "../middlewares/authMiddleware.js";
import { workshopUpload } from "../middlewares/workshopUploadMiddleware.js";

import {
  createWorkshopReview,
  getWorkshopReviews,
} from "../controllers/workshopReviewController.js";

const router = express.Router();

/*
 * Goong Map API
 */
router.get("/goong/autocomplete", searchGoongPlaces);
router.get("/goong/place-detail", getGoongPlaceDetail);
router.get("/goong/reverse-geocode", reverseGoongGeocode);

/*
 * Workshop public routes
 *
 * Phải đặt /nearby trước /:id.
 * Nếu đặt sau /:id thì Express có thể hiểu "nearby" là id.
 */
router.get("/nearby", getNearbyWorkshops);

router.get("/:id/reviews", getWorkshopReviews);

router.post("/:id/reviews", protectedRoute, createWorkshopReview);

router.get("/", getWorkshops);
router.get("/:id", getWorkshopById);

/*
 * Tạo workshop và upload toàn bộ media trong cùng một request.
 *
 * req.files sẽ có dạng:
 * {
 *   thumbnail: [file],
 *   gallery: [file, file, ...],
 *   video: [file]
 * }
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

/*
 * Cập nhật workshop.
 *
 * Phiên bản hiện tại chỉ cập nhật dữ liệu JSON.
 * Nếu sau này cần thay thumbnail/gallery/video khi update,
 * route này cũng cần thêm workshopUpload.fields(...).
 */
router.patch("/:id", protectedRoute, updateWorkshop);

/*
 * Xóa media khỏi Cloudinary.
 */
// router.delete("/media", protectedRoute, deleteMediaController);

export default router;
