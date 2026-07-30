import mongoose from "mongoose";

import PromotionCampaign from "../models/PromotionCampaign.js";
import PromotionPackage from "../models/PromotionPackage.js";
import Workshop from "../models/Workshop.js";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const parseStartAt = (value) => {
  const input = String(value ?? "").trim();

  if (!input) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(input)
    ? new Date(`${input}T00:00:00+07:00`)
    : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const updateCampaignStatuses = async () => {
  const now = new Date();

  await Promise.all([
    PromotionCampaign.updateMany(
      {
        status: "scheduled",
        paymentStatus: "paid",
        startAt: {
          $lte: now,
        },
        endAt: {
          $gt: now,
        },
      },
      {
        $set: {
          status: "active",
          activatedAt: now,
        },
      },
    ),

    PromotionCampaign.updateMany(
      {
        status: {
          $in: ["scheduled", "active"],
        },
        endAt: {
          $lte: now,
        },
      },
      {
        $set: {
          status: "completed",
        },
      },
    ),
  ]);
};

const toCampaignResponse = (campaign) => {
  const workshop = campaign.workshop;

  return {
    _id: String(campaign._id),

    workshopId:
      typeof workshop === "object" ? String(workshop._id) : String(workshop),

    workshopTitle: typeof workshop === "object" ? workshop.title : "Workshop",

    packageCode: campaign.packageSnapshot.code,

    packageName: campaign.packageSnapshot.name,

    placement: campaign.packageSnapshot.placement,

    price: campaign.packageSnapshot.price,

    durationDays: campaign.packageSnapshot.durationDays,

    startAt: campaign.startAt,

    endAt: campaign.endAt,

    status: campaign.status,

    paymentStatus: campaign.paymentStatus,

    impressions: campaign.impressions,

    clicks: campaign.clicks,

    attributedBookings: campaign.attributedBookings,

    createdAt: campaign.createdAt,
  };
};

export const getPromotionPackages = async (req, res) => {
  try {
    const packages = await PromotionPackage.find({
      isActive: true,
    })
      .sort({
        sortOrder: 1,
        price: 1,
      })
      .lean();

    return res.status(200).json({
      packages,
    });
  } catch (error) {
    console.error("Get promotion packages error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải gói quảng bá",
    });
  }
};

export const getMyPromotionCampaigns = async (req, res) => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    await updateCampaignStatuses();

    const campaigns = await PromotionCampaign.find({
      host: hostId,
    })
      .populate({
        path: "workshop",
        select: "title",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      campaigns: campaigns.map(toCampaignResponse),
    });
  } catch (error) {
    console.error("Get promotion campaigns error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải chiến dịch quảng bá",
    });
  }
};

export const createPromotionCampaign = async (req, res) => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const { workshopId, packageCode, startAt } = req.body;

    if (!mongoose.isValidObjectId(workshopId)) {
      return res.status(400).json({
        message: "Workshop không hợp lệ",
      });
    }

    const parsedStartAt = parseStartAt(startAt);

    if (!parsedStartAt) {
      return res.status(400).json({
        message: "Ngày bắt đầu không hợp lệ",
      });
    }

    const [workshop, promotionPackage] = await Promise.all([
      Workshop.findOne({
        _id: workshopId,
        host: hostId,
        status: "published",
      }),

      PromotionPackage.findOne({
        code: String(packageCode ?? "")
          .trim()
          .toUpperCase(),

        isActive: true,
      }),
    ]);

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop đã xuất bản hoặc bạn không có quyền",
      });
    }

    if (!promotionPackage) {
      return res.status(404).json({
        message: "Không tìm thấy gói quảng bá",
      });
    }

    const now = new Date();

    const effectiveStartAt = parsedStartAt <= now ? now : parsedStartAt;

    const endAt = new Date(
      effectiveStartAt.getTime() +
        promotionPackage.durationDays * DAY_IN_MILLISECONDS,
    );

    const duplicatedCampaign = await PromotionCampaign.findOne({
      host: hostId,
      workshop: workshop._id,

      status: {
        $in: ["scheduled", "active"],
      },

      "packageSnapshot.placement": promotionPackage.placement,

      startAt: {
        $lt: endAt,
      },

      endAt: {
        $gt: effectiveStartAt,
      },
    });

    if (duplicatedCampaign) {
      return res.status(409).json({
        message:
          "Workshop đã có chiến dịch trùng vị trí quảng bá trong khoảng thời gian này",
      });
    }

    const status = effectiveStartAt <= now ? "active" : "scheduled";

    /*
     * Chế độ giả lập:
     * coi như thanh toán thành công ngay.
     */
    const campaign = await PromotionCampaign.create({
      host: hostId,
      workshop: workshop._id,

      promotionPackage: promotionPackage._id,

      packageSnapshot: {
        code: promotionPackage.code,

        name: promotionPackage.name,

        price: promotionPackage.price,

        durationDays: promotionPackage.durationDays,

        placement: promotionPackage.placement,
      },

      startAt: effectiveStartAt,

      endAt,

      status,

      paymentProvider: "mock",
      paymentStatus: "paid",
      paidAt: now,

      activatedAt: status === "active" ? now : null,
    });

    await campaign.populate({
      path: "workshop",
      select: "title",
    });

    return res.status(201).json({
      message:
        status === "active"
          ? "Đã kích hoạt quảng bá giả lập"
          : "Đã lên lịch quảng bá giả lập",

      campaign: toCampaignResponse(campaign),
    });
  } catch (error) {
    console.error("Create promotion campaign error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      message: error.message ?? "Không thể tạo chiến dịch quảng bá",
    });
  }
};
