import mongoose from "mongoose";

import Workshop from "../models/Workshop.js";

import {
  deleteWorkshopMedia,
  uploadWorkshopMediaFromBuffer,
} from "../services/cloudinaryService.js";

const WORKSHOP_STATUSES = new Set([
  "draft",
  "published",
  "cancelled",
  "archived",
]);

const calculateEndAt = (startAt, durationStr) => {
  const startDate = new Date(startAt);
  let hours = 2; // default
  if (durationStr) {
    const match = durationStr.match(/(\d+(?:\.\d+)?)\s*(giờ|hour|h)/i);
    if (match) {
      hours = parseFloat(match[1]);
    } else {
      const minMatch = durationStr.match(/(\d+)\s*(phút|minute|m)/i);
      if (minMatch) {
        hours = parseInt(minMatch[1], 10) / 60;
      }
    }
  }
  return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
};

const calculateNextScheduleStartAt = (schedules) => {
  if (!schedules || schedules.length === 0) return null;
  const now = Date.now();
  const upcoming = schedules
    .map((s) => new Date(s.startAt).getTime())
    .filter((time) => time >= now)
    .sort((a, b) => a - b);
  
  if (upcoming.length > 0) {
    return new Date(upcoming[0]);
  }
  return null;
};

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
      startAt: schedule?.startAt,
      seatsTotal,
      spotsLeft,
    };
  });

  const valid = schedules.every((schedule) => {
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

  return valid ? schedules : null;
};

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
  const validMedia = mediaList.filter((media) => media?.publicId);

  if (validMedia.length === 0) {
    return;
  }

  await Promise.allSettled(
    validMedia.map((media) =>
      deleteWorkshopMedia(media.publicId, media.resourceType),
    ),
  );
};

const escapeRegExp = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const validateCoordinates = (location) => {
  const coordinates = location?.coordinates?.coordinates;

  if (
    !location?.address?.trim() ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2
  ) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return {
    longitude,
    latitude,
  };
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

    if (categories.length === 0) {
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

    const validCoordinates = validateCoordinates(location);

    if (!validCoordinates) {
      return res.status(400).json({
        message: "Thông tin địa điểm không hợp lệ",
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
        message: "Lịch workshop không hợp lệ",
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

    if (thumbnail) {
      uploadedMedia.push(thumbnail);
    }

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

    const gallery = galleryResults.map(normalizeMedia).filter(Boolean);

    uploadedMedia.push(...gallery);

    let video = null;

    if (videoFile) {
      const videoResult = await uploadWorkshopMediaFromBuffer(videoFile, {
        folder: "wopy/workshops/videos",

        resource_type: "video",
      });

      video = normalizeMedia(videoResult);

      if (video) {
        uploadedMedia.push(video);
      }
    }

    const { longitude, latitude } = validCoordinates;

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

      schedules: schedules.map((s) => ({
        ...s,
        endAt: calculateEndAt(s.startAt, String(duration ?? "").trim()),
      })),

      nextScheduleStartAt: calculateNextScheduleStartAt(schedules),

      location: {
        address: location.address.trim(),

        placeId: String(location.placeId ?? "").trim(),

        notes: String(location.notes ?? "").trim(),

        ward: String(location.ward ?? "").trim(),
        district: String(location.district ?? "").trim(),
        city: String(location.city ?? "").trim(),
        province: String(location.province ?? "").trim(),
        country: String(location.country ?? "Việt Nam").trim(),
        formattedAddress: String(location.formattedAddress ?? "").trim(),

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

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể tạo workshop",
    });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const userId = req.user?._id;
    const workshopId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const workshop = await Workshop.findOne({
      _id: workshopId,
      host: userId,
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop hoặc bạn không có quyền chỉnh sửa",
      });
    }

    if (req.body.schedules !== undefined) {
      return res.status(400).json({
        message:
          "Không được ghi đè toàn bộ lịch. Hãy sử dụng API thêm lịch riêng",
      });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();

      if (title.length < 5) {
        return res.status(400).json({
          message: "Tên workshop phải có ít nhất 5 ký tự",
        });
      }

      updates.title = title;
    }

    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();

      if (description.length < 30) {
        return res.status(400).json({
          message: "Mô tả workshop phải có ít nhất 30 ký tự",
        });
      }

      updates.description = description;
    }

    if (req.body.duration !== undefined) {
      updates.duration = String(req.body.duration).trim();
    }

    if (req.body.categories !== undefined) {
      const categories = normalizeCategories(req.body.categories);

      if (categories.length === 0) {
        return res.status(400).json({
          message: "Workshop phải có ít nhất một danh mục",
        });
      }

      updates.categories = categories;
    }

    if (req.body.highlights !== undefined) {
      updates.highlights = normalizeStringArray(req.body.highlights);
    }

    if (req.body.includes !== undefined) {
      updates.includes = normalizeStringArray(req.body.includes);
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

    if (req.body.location !== undefined) {
      const location = parseJSONField(req.body.location, null);

      const validCoordinates = validateCoordinates(location);

      if (!validCoordinates) {
        return res.status(400).json({
          message: "Thông tin địa điểm không hợp lệ",
        });
      }

      const { longitude, latitude } = validCoordinates;

      updates.location = {
        address: location.address.trim(),

        placeId: String(location.placeId ?? "").trim(),

        notes: String(location.notes ?? "").trim(),

        ward: String(location.ward ?? "").trim(),
        district: String(location.district ?? "").trim(),
        city: String(location.city ?? "").trim(),
        province: String(location.province ?? "").trim(),
        country: String(location.country ?? "Việt Nam").trim(),
        formattedAddress: String(location.formattedAddress ?? "").trim(),

        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
    }

    if (req.body.duration !== undefined) {
      if (workshop.schedules && workshop.schedules.length > 0) {
        updates.schedules = workshop.schedules.map((s) => ({
          ...s.toObject(),
          endAt: calculateEndAt(s.startAt, updates.duration || workshop.duration),
        }));
        updates.nextScheduleStartAt = calculateNextScheduleStartAt(updates.schedules);
      }
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status);

      if (!WORKSHOP_STATUSES.has(status)) {
        return res.status(400).json({
          message: "Trạng thái workshop không hợp lệ",
        });
      }

      if (status === "published" && workshop.schedules.length === 0) {
        return res.status(400).json({
          message: "Workshop đã xuất bản phải có ít nhất một lịch",
        });
      }

      updates.status = status;
    }

    workshop.set(updates);

    await workshop.save();

    return res.status(200).json({
      message: "Cập nhật workshop thành công",

      workshop,
    });
  } catch (error) {
    console.error("Update workshop error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Dữ liệu workshop không hợp lệ",
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể cập nhật workshop",
    });
  }
};

export const addWorkshopSchedule = async (req, res) => {
  try {
    const userId = req.user?._id;

    const workshopId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const startAt = new Date(req.body.startAt);

    const seatsTotal = Number(req.body.seatsTotal);

    if (Number.isNaN(startAt.getTime())) {
      return res.status(400).json({
        message: "Ngày giờ bắt đầu không hợp lệ",
      });
    }

    if (startAt.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "Lịch mới phải nằm trong tương lai",
      });
    }

    if (!Number.isInteger(seatsTotal) || seatsTotal < 1) {
      return res.status(400).json({
        message: "Số chỗ phải là số nguyên lớn hơn 0",
      });
    }

    const workshop = await Workshop.findOne({
      _id: workshopId,
      host: userId,
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop hoặc bạn không có quyền chỉnh sửa",
      });
    }

    const duplicatedSchedule = workshop.schedules.some((schedule) => {
      const scheduleTime = new Date(schedule.startAt).getTime();

      return scheduleTime === startAt.getTime();
    });

    if (duplicatedSchedule) {
      return res.status(409).json({
        message: "Workshop đã có lịch vào thời gian này",
      });
    }

    workshop.schedules.push({
      startAt,
      endAt: calculateEndAt(startAt, workshop.duration),
      seatsTotal,
      spotsLeft: seatsTotal,
    });
    
    workshop.nextScheduleStartAt = calculateNextScheduleStartAt(workshop.schedules);

    await workshop.save();

    const createdSchedule = workshop.schedules[workshop.schedules.length - 1];

    return res.status(201).json({
      message: "Thêm lịch workshop thành công",

      schedule: createdSchedule,

      workshop,
    });
  } catch (error) {
    console.error("Add workshop schedule error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Dữ liệu lịch workshop không hợp lệ",
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể thêm lịch workshop",
    });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const workshopId = req.params.id;

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const workshop = await Workshop.findById(workshopId).populate(
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
      message: error.message ?? "Không thể tải workshop",
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
    console.error("Delete media error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể xóa media",
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
    console.error("Search Goong places error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tìm địa điểm",
    });
  }
};

export const getGoongPlaceDetail = async (req, res) => {
  try {
    const placeId = String(req.query.place_id ?? "");

    if (!placeId) {
      return res.status(400).json({
        message: "Thiếu place_id",
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
      message: error.message ?? "Không thể lấy chi tiết địa điểm",
    });
  }
};

export const reverseGoongGeocode = async (req, res) => {
  try {
    const latlng = String(req.query.latlng ?? "");

    if (!latlng) {
      return res.status(400).json({
        message: "Thiếu tọa độ latlng",
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
      message: error.message ?? "Không thể lấy địa chỉ từ tọa độ",
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
        message: "Khoảng cách không hợp lệ",
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

    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      query._id = {
        $ne: excludeId,
      };
    }

    const workshops = await Workshop.find(query)
      .select("title thumbnail price location categories schedules duration")
      .limit(8);

    return res.status(200).json({
      workshops,
    });
  } catch (error) {
    console.error("Nearby workshop error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể lấy workshop gần đây",
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
      city,
      district,
      ward,
      lat,
      lng,
      radius,
      dateFrom,
      dateTo,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      status: "published",
    };

    if (search) {
      const escapedSearch = escapeRegExp(search);
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (category) {
      filter.categories = String(category).trim();
    }

    if (maxPrice !== undefined) {
      const numericMaxPrice = Number(maxPrice);
      if (Number.isFinite(numericMaxPrice)) {
        filter.price = { $lte: numericMaxPrice };
      }
    }

    // Structured Location filtering
    if (city) filter["location.city"] = city;
    if (district) filter["location.district"] = district;
    if (ward) filter["location.ward"] = ward;
    if (address && !city && !district && !ward) {
      filter["location.address"] = { $regex: escapeRegExp(address), $options: "i" };
    }

    // Geo Location filtering
    const latitude = Number(lat);
    const longitude = Number(lng);
    const distance = Number(radius ?? 10000);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      filter["location.coordinates"] = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: distance,
        },
      };
    }

    // Date filtering (overlap)
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      
      // If a workshop is from 10 to 12, and we search 11, it overlaps if startAt <= 11 AND endAt >= 11
      // For general overlap of [start1, end1] and [start2, end2]: start1 <= end2 AND end1 >= start2
      filter.schedules = {
        $elemMatch: {
          startAt: dateTo ? { $lte: new Date(dateTo) } : { $exists: true },
          endAt: dateFrom ? { $gte: new Date(dateFrom) } : { $exists: true }
        }
      };
    }

    // Sorting
    let sortConfig = { createdAt: -1 };
    if (sort === "upcoming") {
      sortConfig = { nextScheduleStartAt: 1 };
      filter.nextScheduleStartAt = { $gte: new Date() };
    } else if (sort === "price_asc") {
      sortConfig = { price: 1 };
    } else if (sort === "price_desc") {
      sortConfig = { price: -1 };
    } else if (sort === "rating_desc") {
      sortConfig = { averageRating: -1 };
    } else if (sort === "distance_asc") {
      sortConfig = undefined; // $near sorts automatically
    }

    if (filter["location.coordinates"] && filter["location.coordinates"].$near) {
      sortConfig = undefined; // MongoDB does not allow sort with $near
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const currentPage = Number.isInteger(numericPage) && numericPage > 0 ? numericPage : 1;
    const pageSize = Number.isInteger(numericLimit) && numericLimit > 0 ? Math.min(numericLimit, 50) : 12;

    const [workshops, total] = await Promise.all([
      Workshop.find(filter)
        .populate("host", "displayName avatarUrl username")
        .sort(sortConfig)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Workshop.countDocuments(filter),
    ]);

    // Convert to plain objects
    let resultWorkshops = workshops.map(w => w.toObject());

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      resultWorkshops = resultWorkshops.map(w => {
        if (w.location && w.location.coordinates && w.location.coordinates.coordinates) {
          const [wLng, wLat] = w.location.coordinates.coordinates;
          const R = 6371e3; // metres
          const φ1 = latitude * Math.PI/180;
          const φ2 = wLat * Math.PI/180;
          const Δφ = (wLat-latitude) * Math.PI/180;
          const Δλ = (wLng-longitude) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          w.distanceMeters = Math.round(R * c);
        }
        return w;
      });
    }

    return res.status(200).json({
      workshops: resultWorkshops,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get workshops error:", error);
    return res.status(500).json({
      message: error.message ?? "Không thể tải danh sách workshop",
    });
  }
};
