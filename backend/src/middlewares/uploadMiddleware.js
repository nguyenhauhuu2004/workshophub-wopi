import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1 },
});

export const uploadImageFromBuffer = (buffer, option) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "wopy/avatars",
        resource_type: "image",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
        ...option,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

export const uploadMediaFromBuffer = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const isImage = file.mimetype.startsWith("image/");

    cloudinary.uploader
      .upload_stream(
        {
          folder: "wopy/workshops",
          resource_type: isImage ? "image" : "video",

          ...(isImage && {
            transformation: [
              {
                width: 1000,
                crop: "limit",
                quality: "auto",
                fetch_format: "auto",
              },
            ],
          }),

          ...options,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      )
      .end(file.buffer);
  });
};
