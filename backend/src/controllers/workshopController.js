import Workshop from "../models/Workshop.js";
import {
  deleteWorkshopMedia,
  uploadWorkshopMediaFromBuffer,
} from "../services/cloudinaryService.js";

const parseJSONField = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const WORKSHOP_STATUSES = new Set([
  "draft",
  "published",
  "cancelled",
  "archived",
]);

const normalizeStringArray = (value) => {
  const parsedValue = parseJSONField(value, []);

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return [
    ...new Set(parsedValue.map((item) => String(item).trim()).filter(Boolean)),
  ];
};

const normalizeCategories = (value) => {
  const parsedValue = parseJSONField(value, value);

  const categories = Array.isArray(parsedValue) ? parsedValue : [parsedValue];

  return [
    ...new Set(
      categories
        .map((category) => String(category ?? "").trim())
        .filter(Boolean),
    ),
  ];
};

const normalizeSchedules = (value) => {
  const parsedValue = parseJSONField(value, []);

  if (!Array.isArray(parsedValue)) {
    return null;
  }

  const schedules = parsedValue.map((schedule) => {
    const seatsTotal = Number(schedule?.seatsTotal);

    const spotsLeft =
      schedule?.spotsLeft === undefined
        ? seatsTotal
        : Number(schedule.spotsLeft);

    return {
      ...(schedule?._id ? { _id: schedule._id } : {}),
      startAt: schedule?.startAt,
      seatsTotal,
      spotsLeft,
    };
  });

  const isValid = schedules.every((schedule) => {
    const startAt = new Date(schedule.startAt);

    return (
      !Number.isNaN(startAt.getTime()) &&
      Number.isInteger(schedule.seatsTotal) &&
      schedule.seatsTotal >= 1 &&
      Number.isInteger(schedule.spotsLeft) &&
      schedule.spotsLeft >= 0 &&
      schedule.spotsLeft <= schedule.seatsTotal
    );
  });

  return isValid ? schedules : null;
};

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeMedia = (result) => {
  if (!result) {
    return null;
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  };
};

const cleanupUploadedMedia = async (mediaList) => {
  if (!mediaList.length) {
    return;
  }

  await Promise.allSettled(
    mediaList.map((media) =>
      deleteWorkshopMedia(media.publicId, media.resourceType),
    ),
  );
};

export const createWorkshop = async (req, res) => {
  const uploadedMedia = [];

  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const files = req.files ?? {};

    const thumbnailFile = files.thumbnail?.[0];
    const galleryFiles = files.gallery ?? [];
    const videoFile = files.video?.[0];

    const { title, description, price, duration, status } = req.body;

    const categories = normalizeCategories(req.body.categories);
    const highlights = normalizeStringArray(req.body.highlights);
    const includes = normalizeStringArray(req.body.includes);
    const schedules = normalizeSchedules(req.body.schedules);
    const location = parseJSONField(req.body.location, null);

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Tiêu đề workshop là bắt buộc",
      });
    }

    if (!categories.length) {
      return res.status(400).json({
        message: "Danh mục workshop là bắt buộc",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        message: "Mô tả workshop là bắt buộc",
      });
    }

    if (!thumbnailFile) {
      return res.status(400).json({
        message: "Ảnh thumbnail là bắt buộc",
      });
    }

    if (
      !location?.address?.trim() ||
      !Array.isArray(location?.coordinates?.coordinates) ||
      location.coordinates.coordinates.length !== 2
    ) {
      return res.status(400).json({
        message: "Thông tin địa điểm không hợp lệ",
      });
    }

    const longitude = Number(location.coordinates.coordinates[0]);

    const latitude = Number(location.coordinates.coordinates[1]);

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        message: "Tọa độ địa điểm không hợp lệ",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Giá workshop không hợp lệ",
      });
    }

    if (!schedules) {
      return res.status(400).json({
        message:
          "Lịch workshop không hợp lệ: cần startAt, seatsTotal và spotsLeft hợp lệ",
      });
    }

    const normalizedStatus = status || "published";

    if (!WORKSHOP_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        message: "Trạng thái workshop không hợp lệ",
      });
    }

    if (normalizedStatus === "published" && schedules.length === 0) {
      return res.status(400).json({
        message: "Workshop đã xuất bản phải có ít nhất một lịch",
      });
    }

    const thumbnailResult = await uploadWorkshopMediaFromBuffer(thumbnailFile, {
      folder: "wopy/workshops/thumbnails",
      resource_type: "image",
      transformation: [
        {
          width: 1200,
          height: 675,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    const thumbnail = normalizeMedia(thumbnailResult);

    uploadedMedia.push(thumbnail);

    const galleryResults = await Promise.all(
      galleryFiles.map((file) =>
        uploadWorkshopMediaFromBuffer(file, {
          folder: "wopy/workshops/gallery",
          resource_type: "image",
          transformation: [
            {
              width: 1600,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        }),
      ),
    );

    const gallery = galleryResults.map(normalizeMedia);

    uploadedMedia.push(...gallery);

    let video = null;

    if (videoFile) {
      const videoResult = await uploadWorkshopMediaFromBuffer(videoFile, {
        folder: "wopy/workshops/videos",
        resource_type: "video",
      });

      video = normalizeMedia(videoResult);

      uploadedMedia.push(video);
    }

    const workshop = await Workshop.create({
      host: userId,

      title: title.trim(),
      categories,
      description: description.trim(),

      highlights,
      includes,

      thumbnail,
      gallery,
      video,

      price: numericPrice,
      duration: String(duration ?? "").trim(),

      schedules,

      location: {
        ...location,
        address: location.address.trim(),
        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },

      status: normalizedStatus,
    });

    return res.status(201).json({
      message: "Tạo workshop thành công",
      workshop,
    });
  } catch (error) {
    console.error("Create workshop error:", error);

    await cleanupUploadedMedia(uploadedMedia);

    return res.status(500).json({
      message: "Không thể tạo workshop",
      error: error.message,
    });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const workshop = await Workshop.findOne({
      _id: req.params.id,
      host: userId,
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop hoặc bạn không có quyền chỉnh sửa",
      });
    }

    const updates = {};

    const allowedStringFields = ["title", "description", "duration"];

    for (const field of allowedStringFields) {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]).trim();
      }
    }

    if (req.body.categories !== undefined) {
      const categories = normalizeCategories(req.body.categories);

      if (!categories.length) {
        return res.status(400).json({
          message: "Workshop phải có ít nhất một danh mục",
        });
      }

      updates.categories = categories;
    }

    for (const field of ["highlights", "includes"]) {
      if (req.body[field] !== undefined) {
        updates[field] = normalizeStringArray(req.body[field]);
      }
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Giá workshop không hợp lệ",
        });
      }

      updates.price = price;
    }

    if (req.body.schedules !== undefined) {
      const schedules = normalizeSchedules(req.body.schedules);

      if (!schedules) {
        return res.status(400).json({
          message:
            "Lịch workshop không hợp lệ: cần startAt, seatsTotal và spotsLeft hợp lệ",
        });
      }

      updates.schedules = schedules;
    }

    if (req.body.location !== undefined) {
      const location = parseJSONField(req.body.location, null);

      const rawCoordinates = location?.coordinates?.coordinates;

      const longitude = Number(rawCoordinates?.[0]);
      const latitude = Number(rawCoordinates?.[1]);

      if (
        !location?.address?.trim() ||
        !Array.isArray(rawCoordinates) ||
        rawCoordinates.length !== 2 ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          message: "Thông tin địa điểm không hợp lệ",
        });
      }

      updates.location = {
        ...location,
        address: location.address.trim(),
        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
    }

    if (req.body.status !== undefined) {
      if (!WORKSHOP_STATUSES.has(req.body.status)) {
        return res.status(400).json({
          message: "Trạng thái workshop không hợp lệ",
        });
      }

      updates.status = req.body.status;
    }

    const nextStatus = updates.status ?? workshop.status;

    const nextSchedules = updates.schedules ?? workshop.schedules;

    if (nextStatus === "published" && nextSchedules.length === 0) {
      return res.status(400).json({
        message: "Workshop đã xuất bản phải có ít nhất một lịch",
      });
    }

    workshop.set(updates);

    await workshop.save();

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

    return res.status(200).json({
      workshop,
    });
  } catch (error) {
    console.error("Get workshop detail error:", error);

    return res.status(500).json({
      message: "Không thể tải workshop",
      error: error.message,
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

    if (resourceType !== "image" && resourceType !== "video") {
      return res.status(400).json({
        message: "resourceType không hợp lệ",
      });
    }

    await deleteWorkshopMedia(publicId, resourceType);

    return res.status(200).json({
      message: "Đã xóa media",
    });
  } catch (error) {
    console.error("Delete media error:", error);

    return res.status(500).json({
      message: "Không thể xóa media",
      error: error.message,
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

    if (!process.env.GOONG_REST_API_KEY) {
      return res.status(500).json({
        message: "Chưa cấu hình Goong API key",
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
    console.error("Search Goong places error:", error);

    return res.status(500).json({
      message: "Không thể tìm địa điểm",
      error: error.message,
    });
  }
};

export const getGoongPlaceDetail = async (req, res) => {
  try {
    const placeId = String(req.query.place_id ?? "").trim();

    if (!placeId) {
      return res.status(400).json({
        message: "Thiếu place_id",
      });
    }

    if (!process.env.GOONG_REST_API_KEY) {
      return res.status(500).json({
        message: "Chưa cấu hình Goong API key",
      });
    }

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
    console.error("Get Goong place detail error:", error);

    return res.status(500).json({
      message: "Không thể lấy chi tiết địa điểm",
      error: error.message,
    });
  }
};

export const reverseGoongGeocode = async (req, res) => {
  try {
    const latlng = String(req.query.latlng ?? "").trim();

    if (!latlng) {
      return res.status(400).json({
        message: "Thiếu tọa độ latlng",
      });
    }

    if (!process.env.GOONG_REST_API_KEY) {
      return res.status(500).json({
        message: "Chưa cấu hình Goong API key",
      });
    }

    const params = new URLSearchParams({
      latlng,
      api_key: process.env.GOONG_REST_API_KEY,
    });

    const response = await fetch(`https://rsapi.goong.io/Geocode?${params}`);

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Reverse geocode error:", error);

    return res.status(500).json({
      message: "Không thể lấy địa chỉ từ tọa độ",
      error: error.message,
    });
  }
};

export const getNearbyWorkshops = async (req, res) => {
  try {
    const longitude = Number(req.query.longitude);

    const latitude = Number(req.query.latitude);

    const distance = Number(req.query.distance ?? 10_000);

    const excludeId = req.query.excludeId;

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        message: "Tọa độ không hợp lệ",
      });
    }

    if (!Number.isFinite(distance) || distance <= 0 || distance > 100_000) {
      return res.status(400).json({
        message: "Khoảng cách phải nằm trong khoảng 1 đến 100000 mét",
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
      .select("title thumbnail price location categories")
      .limit(8);

    return res.status(200).json({
      workshops,
    });
  } catch (error) {
    console.error("Nearby workshop error:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách workshop gần đây",
      error: error.message,
    });
  }
};

export const getWorkshops = async (req, res) => {
  try {
    const {
      search,
      category,
      maxPrice,
      address,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      status: "published",
    };

    if (search) {
      const escapedSearch = escapeRegExp(search);

      filter.$or = [
        {
          title: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.categories = String(category).trim();
    }

    if (maxPrice !== undefined) {
      const numericMaxPrice = Number(maxPrice);

      if (Number.isFinite(numericMaxPrice) && numericMaxPrice >= 0) {
        filter.price = {
          $lte: numericMaxPrice,
        };
      }
    }

    if (address) {
      filter["location.address"] = {
        $regex: escapeRegExp(address),
        $options: "i",
      };
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);

    const currentPage =
      Number.isInteger(numericPage) && numericPage > 0 ? numericPage : 1;

    const pageSize =
      Number.isInteger(numericLimit) && numericLimit > 0
        ? Math.min(numericLimit, 50)
        : 12;

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
      error: error.message,
    });
  }
};
