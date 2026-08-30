import multer from "multer";

const reviewImageUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new Error("Đánh giá chỉ được đính kèm hình ảnh"));
      return;
    }

    callback(null, true);
  },
});

export const uploadWorkshopReviewImages = (req, res, next) => {
  reviewImageUpload.array("images", 5)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Mỗi hình ảnh không được vượt quá 5MB",
        });
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "Chỉ được tải tối đa 5 hình ảnh",
        });
      }
    }

    return res.status(400).json({
      message: error.message ?? "Hình ảnh đánh giá không hợp lệ",
    });
  });
};
