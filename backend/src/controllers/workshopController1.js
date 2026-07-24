import Workshop from "../models/Workshop.js";
import {
  deleteWorkshopMedia,
  uploadWorkshopMediaFromBuffer,
} from "../services/cloudinaryService.js";
import { uploadMediaFromBuffer } from "../middlewares/uploadMiddleware.js";

export const uploadWorkshopMediaController = async (req, res) => {
  try {
    const files = req.files ?? [];

    if (!files.length) {
      return res.status(400).json({
        message: "Không có file được upload",
      });
    }

    const media = await Promise.all(
      files.map((file) => uploadWorkshopMediaFromBuffer(file)),
    );

    return res.status(200).json({ media });
  } catch (error) {
    console.error("Upload workshop media error:", error);

    return res.status(500).json({
      message: "Upload media thất bại",
      error: error.message,
    });
  }
};

export const createWorkshop = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Chưa xác thực người dùng",
      });
    }

    const {
      title,
      category,
      description,
      highlights,
      includes,
      thumbnail,
      gallery,
      video,
      price,
      duration,
      seatsTotal,
      level,
      schedules,
      location,
      status,
    } = req.body;

    if (!title || !category || !description || !thumbnail?.url) {
      return res.status(400).json({
        message: "Thiếu thông tin workshop bắt buộc",
      });
    }

    if (
      !location?.address ||
      !Array.isArray(location?.coordinates?.coordinates) ||
      location.coordinates.coordinates.length !== 2
    ) {
      return res.status(400).json({
        message: "Thông tin địa điểm không hợp lệ",
      });
    }

    const workshop = await Workshop.create({
      host: userId,
      title,
      category,
      description,
      highlights,
      includes,
      thumbnail,
      gallery,
      video,
      price,
      duration,
      seatsTotal,
      level,
      schedules,
      location,
      status: status ?? "published",
    });

    return res.status(201).json({
      message: "Tạo workshop thành công",
      workshop,
    });
  } catch (error) {
    console.error("Create workshop error:", error);

    return res.status(500).json({
      message: "Không thể tạo workshop",
      error: error.message,
    });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findOneAndUpdate(
      {
        _id: req.params.id,
        host: req.user?._id,
      },
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop hoặc bạn không có quyền chỉnh sửa",
      });
    }

    return res.status(200).json({
      message: "Cập nhật workshop thành công",
      workshop,
    });
  } catch (error) {
    console.error("Update workshop error:", error);

    return res.status(500).json({
      message: "Không thể cập nhật workshop",
      error: error.message,
    });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id).populate(
      "host",
      "displayName avatarUrl username",
    );

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop",
      });
    }

    return res.status(200).json({ workshop });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể tải workshop",
    });
  }
};

export const deleteMediaController = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return res.status(400).json({
        message: "Thiếu publicId",
      });
    }

    await deleteWorkshopMedia(publicId, resourceType);

    return res.status(200).json({
      message: "Đã xóa media",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể xóa media",
    });
  }
};

export const searchGoongPlaces = async (req, res) => {
  try {
    const input = String(req.query.input ?? "").trim();

    if (input.length < 2) {
      return res.status(200).json({
        predictions: [],
      });
    }

    const params = new URLSearchParams({
      input,
      api_key: process.env.GOONG_REST_API_KEY,
      limit: "8",
      more_compound: "true",
    });

    if (req.query.location) {
      params.set("location", String(req.query.location));
    }

    const response = await fetch(
      `https://rsapi.goong.io/Place/AutoComplete?${params}`,
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Không thể tìm địa điểm",
    });
  }
};

export const getGoongPlaceDetail = async (req, res) => {
  try {
    const placeId = String(req.query.place_id ?? "");

    const params = new URLSearchParams({
      place_id: placeId,
      api_key: process.env.GOONG_REST_API_KEY,
    });

    const response = await fetch(
      `https://rsapi.goong.io/Place/Detail?${params}`,
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Không thể lấy chi tiết địa điểm",
    });
  }
};

export const reverseGoongGeocode = async (req, res) => {
  try {
    const latlng = String(req.query.latlng ?? "");

    const params = new URLSearchParams({
      latlng,
      api_key: process.env.GOONG_REST_API_KEY,
    });

    const response = await fetch(`https://rsapi.goong.io/Geocode?${params}`);

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Không thể lấy địa chỉ từ tọa độ",
    });
  }
};

export const getNearbyWorkshops = async (req, res) => {
  try {
    const longitude = Number(req.query.longitude);
    const latitude = Number(req.query.latitude);
    const distance = Number(req.query.distance ?? 10_000);
    const excludeId = req.query.excludeId;

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return res.status(400).json({
        message: "Tọa độ không hợp lệ",
      });
    }

    const query = {
      status: "published",

      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: distance,
        },
      },
    };

    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }

    const workshops = await Workshop.find(query)
      .select("title thumbnail price location category")
      .limit(8);

    return res.status(200).json({
      workshops,
    });
  } catch (error) {
    console.error("Nearby workshop error:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách workshop gần đây",
    });
  }
};

export const getWorkshops = async (req, res) => {
  try {
    const {
      search,
      category,
      maxPrice,
      level,
      address,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      status: "published",
    };

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    if (maxPrice !== undefined) {
      filter.price = {
        $lte: Number(maxPrice),
      };
    }

    if (address) {
      filter["location.address"] = {
        $regex: address,
        $options: "i",
      };
    }

    const currentPage = Math.max(Number(page), 1);

    const pageSize = Math.min(Math.max(Number(limit), 1), 50);

    const [workshops, total] = await Promise.all([
      Workshop.find(filter)
        .populate("host", "displayName avatarUrl")
        .sort({
          createdAt: -1,
        })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      Workshop.countDocuments(filter),
    ]);

    return res.status(200).json({
      workshops,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get workshops error:", error);

    return res.status(500).json({
      message: "Không thể tải danh sách workshop",
    });
  }
};
