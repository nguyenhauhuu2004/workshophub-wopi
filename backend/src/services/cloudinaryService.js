import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file từ Multer memoryStorage lên Cloudinary.
 *
 * Hàm này trả về kết quả gốc của Cloudinary:
 * {
 *   secure_url,
 *   public_id,
 *   resource_type,
 *   ...
 * }
 *
 * Controller sẽ chịu trách nhiệm chuẩn hóa thành:
 * {
 *   url,
 *   publicId,
 *   resourceType
 * }
 */
export const uploadWorkshopMediaFromBuffer = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer) {
      reject(new Error("File upload không có buffer"));
      return;
    }

    const inferredResourceType = file.mimetype?.startsWith("video/")
      ? "video"
      : "image";

    const resourceType = options.resource_type ?? inferredResourceType;

    const uploadOptions = {
      folder:
        options.folder ??
        (resourceType === "video"
          ? "wopy/workshops/videos"
          : "wopy/workshops/images"),

      resource_type: resourceType,

      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary không trả về kết quả upload"));
          return;
        }

        // Trả nguyên result để normalizeMedia trong controller xử lý.
        resolve(result);
      },
    );

    uploadStream.on("error", reject);
    uploadStream.end(file.buffer);
  });
};

/**
 * Alias cũ, giữ lại nếu nơi khác trong dự án đang sử dụng.
 */
export const uploadWorkshopFile = (file, options = {}) => {
  return uploadWorkshopMediaFromBuffer(file, options);
};

export const deleteWorkshopMedia = async (publicId, resourceType = "image") => {
  if (!publicId) {
    throw new Error("Thiếu publicId của media cần xóa");
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};
