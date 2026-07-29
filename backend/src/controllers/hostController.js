import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import PromotionCampaign from "../models/PromotionCampaign.js";
import Workshop from "../models/Workshop.js";

const PROMOTION_PACKAGES = [
  {
    code: "HOME_7",
    name: "Nổi bật trang chủ",
    price: 390_000,
    durationDays: 7,
    placement: "homepage",
    description: "Xuất hiện trong khu vực workshop nổi bật trên trang chủ.",
  },
  {
    code: "SEARCH_7",
    name: "Ưu tiên tìm kiếm",
    price: 290_000,
    durationDays: 7,
    placement: "search",
    description: "Tăng thứ hạng có kiểm soát trong kết quả tìm kiếm phù hợp.",
  },
  {
    code: "BOOST_14",
    name: "Trang chủ + tìm kiếm",
    price: 690_000,
    durationDays: 14,
    placement: "homepage_search",
    description: "Kết hợp vị trí trang chủ và ưu tiên trong tìm kiếm.",
  },
];

const parseDateRange = (req) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(to.getFullYear(), to.getMonth(), 1);

  return { from, to };
};

export const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { from, to } = parseDateRange(req);

    const [
      revenueResult,
      bookingResult,
      workshopCount,
      publishedCount,
      draftCount,
      promotionResult,
      revenueSeriesResult,
    ] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            host: new mongoose.Types.ObjectId(hostId),
            paidAt: {
              $gte: from,
              $lte: to,
            },
            paymentStatus: {
              $in: ["paid", "partially_refunded", "refunded"],
            },
          },
        },
        {
          $group: {
            _id: null,
            gross: {
              $sum: "$grossAmount",
            },
            discounts: {
              $sum: "$discountAmount",
            },
            refunds: {
              $sum: "$refundAmount",
            },
            platformFee: {
              $sum: "$platformFee",
            },
            net: {
              $sum: "$hostNetAmount",
            },
            pendingPayout: {
              $sum: {
                $cond: [
                  {
                    $in: ["$payoutStatus", ["pending", "held"]],
                  },
                  "$hostNetAmount",
                  0,
                ],
              },
            },
            paidOut: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$payoutStatus", "paid"],
                  },
                  "$hostNetAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            host: new mongoose.Types.ObjectId(hostId),
            createdAt: {
              $gte: from,
              $lte: to,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            confirmed: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "confirmed"],
                  },
                  1,
                  0,
                ],
              },
            },
            checkedIn: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "checked_in"],
                  },
                  1,
                  0,
                ],
              },
            },
            cancelled: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "cancelled"],
                  },
                  1,
                  0,
                ],
              },
            },
            noShow: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "no_show"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      Workshop.countDocuments({
        host: hostId,
      }),

      Workshop.countDocuments({
        host: hostId,
        status: "published",
      }),

      Workshop.countDocuments({
        host: hostId,
        status: "draft",
      }),

      PromotionCampaign.aggregate([
        {
          $match: {
            host: new mongoose.Types.ObjectId(hostId),
            createdAt: {
              $gte: from,
              $lte: to,
            },
          },
        },
        {
          $group: {
            _id: null,
            activeCampaigns: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "active"],
                  },
                  1,
                  0,
                ],
              },
            },
            impressions: {
              $sum: "$impressions",
            },
            clicks: {
              $sum: "$clicks",
            },
            attributedBookings: {
              $sum: "$attributedBookings",
            },
            spend: {
              $sum: "$price",
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            host: new mongoose.Types.ObjectId(hostId),
            paidAt: {
              $gte: from,
              $lte: to,
            },
            paymentStatus: {
              $in: ["paid", "partially_refunded", "refunded"],
            },
          },
        },
        {
          $group: {
            _id: {
              year: {
                $year: "$paidAt",
              },
              month: {
                $month: "$paidAt",
              },
              day: {
                $dayOfMonth: "$paidAt",
              },
            },
            gross: {
              $sum: "$grossAmount",
            },
            net: {
              $sum: "$hostNetAmount",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]),
    ]);

    const revenue = revenueResult[0] ?? {
      gross: 0,
      discounts: 0,
      refunds: 0,
      platformFee: 0,
      net: 0,
      pendingPayout: 0,
      paidOut: 0,
    };

    const bookings = bookingResult[0] ?? {
      total: 0,
      confirmed: 0,
      checkedIn: 0,
      cancelled: 0,
      noShow: 0,
    };

    const promotion = promotionResult[0] ?? {
      activeCampaigns: 0,
      impressions: 0,
      clicks: 0,
      attributedBookings: 0,
      spend: 0,
    };

    // TODO: sửa pipeline này theo cấu trúc schedules thực tế.
    const workshopRows = await Workshop.aggregate([
      {
        $match: {
          host: new mongoose.Types.ObjectId(hostId),
        },
      },
      { $unwind: "$schedules" },
      {
        $match: {
          "schedules.startsAt": {
            $gte: new Date(),
          },
        },
      },
      {
        $group: {
          _id: null,
          upcomingSessions: {
            $sum: 1,
          },
          emptySessions: {
            $sum: {
              $cond: [
                {
                  $eq: ["$schedules.bookedCount", 0],
                },
                1,
                0,
              ],
            },
          },
          lowFillSessions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gt: ["$schedules.bookedCount", 0],
                    },
                    {
                      $lt: [
                        {
                          $divide: [
                            "$schedules.bookedCount",
                            "$schedules.capacity",
                          ],
                        },
                        0.3,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return res.json({
      revenue,
      bookings,
      workshops: {
        total: workshopCount,
        published: publishedCount,
        draft: draftCount,
        upcomingSessions: workshopRows[0]?.upcomingSessions ?? 0,
        emptySessions: workshopRows[0]?.emptySessions ?? 0,
        lowFillSessions: workshopRows[0]?.lowFillSessions ?? 0,
      },
      promotion,
      revenueSeries: revenueSeriesResult.map((item) => ({
        label: `${String(item._id.day).padStart(2, "0")}/${String(
          item._id.month,
        ).padStart(2, "0")}`,
        gross: item.gross,
        net: item.net,
      })),
    });
  } catch (error) {
    console.error("Get host dashboard error:", error);

    return res.status(500).json({
      message: "Không thể tải tổng quan dành cho host",
    });
  }
};

export const getHostWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({
      host: req.user._id,
    })
      .select("title category status thumbnail schedules")
      .sort({ createdAt: -1 })
      .lean();

    const workshopIds = workshops.map((item) => item._id);

    const bookingStats = await Booking.aggregate([
      {
        $match: {
          workshop: {
            $in: workshopIds,
          },
          paymentStatus: {
            $in: ["paid", "partially_refunded"],
          },
        },
      },
      {
        $group: {
          _id: "$workshop",
          totalBookings: {
            $sum: "$quantity",
          },
          totalRevenue: {
            $sum: "$hostNetAmount",
          },
        },
      },
    ]);

    const statsMap = new Map(
      bookingStats.map((item) => [String(item._id), item]),
    );

    const rows = workshops.map((workshop) => {
      const futureSessions = (workshop.schedules ?? [])
        .filter((session) => new Date(session.startsAt) >= new Date())
        .sort(
          (first, second) =>
            new Date(first.startsAt) - new Date(second.startsAt),
        );

      const nextSession = futureSessions[0];

      const occupancyRate =
        nextSession?.capacity > 0
          ? Math.round(
              ((nextSession.bookedCount ?? 0) / nextSession.capacity) * 100,
            )
          : 0;

      const stats = statsMap.get(String(workshop._id)) ?? {};

      return {
        _id: workshop._id,
        title: workshop.title,
        category: workshop.category,
        status: workshop.status,
        thumbnail: workshop.thumbnail,
        nextSession: nextSession
          ? {
              sessionId: nextSession._id,
              startsAt: nextSession.startsAt,
              capacity: nextSession.capacity,
              bookedCount: nextSession.bookedCount ?? 0,
            }
          : undefined,
        totalBookings: stats.totalBookings ?? 0,
        totalRevenue: stats.totalRevenue ?? 0,
        occupancyRate,
      };
    });

    return res.json({
      workshops: rows,
    });
  } catch (error) {
    console.error("Get host workshops error:", error);

    return res.status(500).json({
      message: "Không thể tải workshop của host",
    });
  }
};

export const getHostBookings = async (req, res) => {
  try {
    const filter = {
      host: req.user._id,
    };

    if (req.query.workshopId) {
      filter.workshop = req.query.workshopId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("workshop", "title")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      bookings: bookings.map((booking) => ({
        _id: booking._id,
        bookingCode: booking.bookingCode,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        workshopId: booking.workshop?._id,
        workshopTitle: booking.workshop?.title ?? "Workshop đã xóa",
        sessionId: booking.sessionId,
        sessionLabel: booking.sessionLabel ?? "Chưa cập nhật",
        quantity: booking.quantity,
        total: booking.grossAmount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        checkedInAt: booking.checkedInAt,
        createdAt: booking.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get host bookings error:", error);

    return res.status(500).json({
      message: "Không thể tải đơn đặt chỗ",
    });
  }
};

export const checkInBooking = async (req, res) => {
  try {
    const ticketCode = String(req.body.ticketCode ?? "").trim();

    if (!ticketCode) {
      return res.status(400).json({
        message: "Mã vé không được để trống",
      });
    }

    const qrTokenHash = Booking.hashTicketCode(ticketCode);

    const booking = await Booking.findOne({
      qrTokenHash,
    }).populate("workshop", "title");

    if (!booking) {
      return res.status(404).json({
        message: "Mã vé không hợp lệ",
      });
    }

    if (String(booking.host) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Bạn không có quyền check-in vé này",
      });
    }

    if (booking.checkedInAt) {
      return res.status(409).json({
        message: `Vé đã check-in lúc ${booking.checkedInAt.toLocaleString(
          "vi-VN",
        )}`,
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(409).json({
        message: "Đơn chưa thanh toán",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(409).json({
        message: `Không thể check-in đơn ở trạng thái ${booking.status}`,
      });
    }

    // Update có điều kiện để chống hai thiết bị check-in cùng lúc.
    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        checkedInAt: null,
        status: "confirmed",
      },
      {
        $set: {
          status: "checked_in",
          checkedInAt: new Date(),
          checkedInBy: req.user._id,
          checkInMethod: "qr",
        },
      },
      {
        new: true,
      },
    ).populate("workshop", "title");

    if (!updated) {
      return res.status(409).json({
        message: "Vé vừa được check-in trên thiết bị khác",
      });
    }

    return res.json({
      message: "Check-in thành công",
      booking: {
        _id: updated._id,
        bookingCode: updated.bookingCode,
        attendeeName: updated.attendeeName,
        attendeeEmail: updated.attendeeEmail,
        workshopId: updated.workshop?._id,
        workshopTitle: updated.workshop?.title,
        sessionId: updated.sessionId,
        sessionLabel: updated.sessionLabel ?? "Chưa cập nhật",
        quantity: updated.quantity,
        total: updated.grossAmount,
        paymentStatus: updated.paymentStatus,
        status: updated.status,
        checkedInAt: updated.checkedInAt,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("Check-in booking error:", error);

    return res.status(500).json({
      message: "Không thể check-in vé",
    });
  }
};

export const getHostRevenue = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req);

    const bookings = await Booking.find({
      host: req.user._id,
      paidAt: {
        $gte: from,
        $lte: to,
      },
      paymentStatus: {
        $in: ["paid", "partially_refunded", "refunded"],
      },
    })
      .populate("workshop", "title")
      .sort({ paidAt: -1 })
      .lean();

    return res.json({
      transactions: bookings.map((booking) => ({
        _id: booking._id,
        bookingCode: booking.bookingCode,
        workshopTitle: booking.workshop?.title ?? "Workshop đã xóa",
        paidAt: booking.paidAt,
        gross: booking.grossAmount,
        refund: booking.refundAmount,
        platformFee: booking.platformFee,
        hostNet: booking.hostNetAmount,
        payoutStatus: booking.payoutStatus,
      })),
    });
  } catch (error) {
    console.error("Get host revenue error:", error);

    return res.status(500).json({
      message: "Không thể tải báo cáo doanh thu",
    });
  }
};

export const getPromotionPackages = async (req, res) => {
  return res.json({
    packages: PROMOTION_PACKAGES,
  });
};

export const getPromotionCampaigns = async (req, res) => {
  try {
    const campaigns = await PromotionCampaign.find({
      host: req.user._id,
    })
      .populate("workshop", "title")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      campaigns: campaigns.map((campaign) => ({
        _id: campaign._id,
        workshopId: campaign.workshop?._id,
        workshopTitle: campaign.workshop?.title ?? "Workshop đã xóa",
        packageCode: campaign.packageCode,
        packageName: campaign.packageName,
        placement: campaign.placement,
        startAt: campaign.startAt,
        endAt: campaign.endAt,
        price: campaign.price,
        status: campaign.status,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        attributedBookings: campaign.attributedBookings,
      })),
    });
  } catch (error) {
    console.error("Get promotion campaigns error:", error);

    return res.status(500).json({
      message: "Không thể tải chiến dịch quảng cáo",
    });
  }
};

export const createPromotionCampaign = async (req, res) => {
  try {
    const { workshopId, packageCode, startAt } = req.body;

    const workshop = await Workshop.findOne({
      _id: workshopId,
      host: req.user._id,
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Không tìm thấy workshop thuộc host",
      });
    }

    if (workshop.status !== "published") {
      return res.status(400).json({
        message: "Chỉ workshop đang xuất bản mới được quảng cáo",
      });
    }

    const promotionPackage = PROMOTION_PACKAGES.find(
      (item) => item.code === packageCode,
    );

    if (!promotionPackage) {
      return res.status(400).json({
        message: "Gói quảng cáo không hợp lệ",
      });
    }

    const campaignStart = new Date(startAt);

    if (Number.isNaN(campaignStart.getTime())) {
      return res.status(400).json({
        message: "Ngày bắt đầu không hợp lệ",
      });
    }

    const campaignEnd = new Date(campaignStart);

    campaignEnd.setDate(campaignEnd.getDate() + promotionPackage.durationDays);

    const campaign = await PromotionCampaign.create({
      host: req.user._id,
      workshop: workshop._id,
      packageCode: promotionPackage.code,
      packageName: promotionPackage.name,
      placement: promotionPackage.placement,
      durationDays: promotionPackage.durationDays,
      price: promotionPackage.price,
      startAt: campaignStart,
      endAt: campaignEnd,
      status: "pending_payment",
      paymentStatus: "pending",
    });

    // TODO:
    // 1. Tạo giao dịch thanh toán quảng cáo.
    // 2. Trả checkoutUrl của VNPay/MoMo/Stripe.
    // 3. Webhook thanh toán thành công đổi:
    //    paymentStatus = "paid"
    //    status = startAt <= now ? "active" : "scheduled"

    return res.status(201).json({
      message: "Đã tạo yêu cầu mua gói nổi bật",
      campaign: {
        _id: campaign._id,
        workshopId: workshop._id,
        workshopTitle: workshop.title,
        packageCode: campaign.packageCode,
        packageName: campaign.packageName,
        placement: campaign.placement,
        startAt: campaign.startAt,
        endAt: campaign.endAt,
        price: campaign.price,
        status: campaign.status,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        attributedBookings: campaign.attributedBookings,
      },
    });
  } catch (error) {
    console.error("Create promotion campaign error:", error);

    return res.status(500).json({
      message: "Không thể tạo chiến dịch quảng cáo",
    });
  }
};
