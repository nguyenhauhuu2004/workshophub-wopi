import { uploadWorkshopFile } from "../services/cloudinaryService.js";

export const uploadWorkshopMedia = async (req, res) => {
  try {
    const files = req.files ?? [];

    if (!files.length) {
      return res.status(400).json({
        message: "Không có file được upload",
      });
    }

    const media = await Promise.all(
      files.map((file) => uploadWorkshopFile(file)),
    );

    return res.status(200).json({ media });
  } catch (error) {
    console.error("Upload workshop media error:", error);

    return res.status(500).json({
      message: "Không thể upload media",
    });
  }
};
