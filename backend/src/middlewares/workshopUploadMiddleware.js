import multer from "multer";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const workshopUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 10,
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Định dạng file không được hỗ trợ"));
    }

    callback(null, true);
  },
});
