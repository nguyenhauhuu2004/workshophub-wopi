import multer from "multer";

export const uploadWorkshopMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, callback) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      return callback(new Error("Chỉ hỗ trợ file ảnh hoặc video"));
    }

    callback(null, true);
  },
});
