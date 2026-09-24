import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import Workshop from "../models/Workshop.js";

export const createDiscount = async (req, res) => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const {
      workshopId,
      code,
      applyType = "code",
      type,
      value,
      maxUsage,
      expiresAt,
    } = req.body;

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({ message: "Workshop không hợp lệ" });
    }

    const workshop = await Workshop.findOne({ _id: workshopId, host: hostId });
    if (!workshop) {
      return res.status(404).json({ message: "Không tìm thấy workshop hoặc bạn không có quyền" });
    }

    let normalizedCode = String(code ?? "").trim().toUpperCase();
    if (applyType === "direct") {
      if (!normalizedCode) {
        normalizedCode = `DIRECT_${Date.now().toString(36).toUpperCase()}`;
      }
    } else {
      if (!normalizedCode || normalizedCode.length < 3) {
        return res.status(400).json({ message: "Mã giảm giá phải có ít nhất 3 ký tự" });
      }
    }

    if (!type || !["percentage", "fixed"].includes(type)) {
      return res.status(400).json({ message: "Loại giảm giá không hợp lệ" });
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ message: "Giá trị giảm giá không hợp lệ" });
    }

    if (type === "percentage" && numericValue > 100) {
      return res.status(400).json({ message: "Phần trăm giảm giá không được vượt quá 100%" });
    }

    const existing = await Discount.findOne({ workshop: workshopId, code: normalizedCode });
    if (existing) {
      return res.status(409).json({ message: "Mã giảm giá này đã tồn tại cho workshop này" });
    }

    const discount = await Discount.create({
      host: hostId,
      workshop: workshopId,
      applyType,
      code: normalizedCode,
      type,
      value: numericValue,
      maxUsage: applyType === "direct" ? null : (maxUsage ? Number(maxUsage) : null),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });

    if (applyType === "direct") {
      workshop.directDiscount = {
        type,
        value: numericValue,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      };
      await workshop.save();
    }

    return res.status(201).json({
      message: applyType === "direct" ? "Đã áp dụng giảm giá trực tiếp cho workshop" : "Tạo mã giảm giá thành công",
      discount,
    });
  } catch (error) {
    console.error("Create discount error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã giảm giá bị trùng" });
    }
    return res.status(500).json({ message: error.message ?? "Không thể tạo giảm giá" });
  }
};

export const getHostDiscounts = async (req, res) => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const discounts = await Discount.find({ host: hostId })
      .populate({ path: "workshop", select: "title price directDiscount" })
      .sort({ createdAt: -1 })
      .lean();

    const rows = discounts.map((d) => ({
      _id: String(d._id),
      workshopId: typeof d.workshop === "object" ? String(d.workshop._id) : String(d.workshop),
      workshopTitle: typeof d.workshop === "object" ? d.workshop.title : "Workshop",
      applyType: d.applyType ?? "code",
      code: d.code,
      type: d.type,
      value: d.value,
      maxUsage: d.maxUsage,
      usedCount: d.usedCount,
      isActive: d.isActive,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({ discounts: rows });
  } catch (error) {
    console.error("Get host discounts error:", error);
    return res.status(500).json({ message: error.message ?? "Không thể tải mã giảm giá" });
  }
};

export const toggleDiscount = async (req, res) => {
  try {
    const hostId = req.user?._id;
    const discountId = req.params.id;

    if (!hostId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    if (!mongoose.isValidObjectId(discountId)) {
      return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
    }

    const discount = await Discount.findOne({ _id: discountId, host: hostId });
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    discount.isActive = !discount.isActive;
    await discount.save();

    if (discount.applyType === "direct") {
      const workshop = await Workshop.findById(discount.workshop);
      if (workshop) {
        if (!workshop.directDiscount) {
          workshop.directDiscount = {
            type: discount.type,
            value: discount.value,
            expiresAt: discount.expiresAt,
          };
        }
        workshop.directDiscount.isActive = discount.isActive;
        await workshop.save();
      }
    }

    return res.status(200).json({
      message: discount.isActive ? "Đã kích hoạt giảm giá" : "Đã tắt giảm giá",
      discount,
    });
  } catch (error) {
    console.error("Toggle discount error:", error);
    return res.status(500).json({ message: error.message ?? "Không thể cập nhật mã giảm giá" });
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    const hostId = req.user?._id;
    const discountId = req.params.id;

    if (!hostId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    if (!mongoose.isValidObjectId(discountId)) {
      return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
    }

    const discount = await Discount.findOneAndDelete({ _id: discountId, host: hostId });
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    if (discount.applyType === "direct") {
      const workshop = await Workshop.findById(discount.workshop);
      if (workshop && workshop.directDiscount) {
        workshop.directDiscount.isActive = false;
        await workshop.save();
      }
    }

    return res.status(200).json({ message: "Đã xóa giảm giá" });
  } catch (error) {
    console.error("Delete discount error:", error);
    return res.status(500).json({ message: error.message ?? "Không thể xóa mã giảm giá" });
  }
};

export const validateDiscount = async (req, res) => {
  try {
    const { workshopId, code } = req.body;
    if (!workshopId || !code) {
      return res.status(400).json({ message: "Thiếu workshop hoặc mã giảm giá" });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const now = new Date();

    const discount = await Discount.findOne({
      workshop: workshopId,
      code: normalizedCode,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });

    if (!discount) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc đã hết hạn" });
    }

    if (discount.maxUsage != null && discount.usedCount >= discount.maxUsage) {
      return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });
    }

    return res.status(200).json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      message: discount.type === "percentage" ? `Giảm ${discount.value}%` : `Giảm ${new Intl.NumberFormat("vi-VN").format(discount.value)}đ`,
    });
  } catch (error) {
    console.error("Validate discount error:", error);
    return res.status(500).json({ message: error.message ?? "Không thể kiểm tra mã giảm giá" });
  }
};
