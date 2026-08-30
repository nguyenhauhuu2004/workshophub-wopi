import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Workshop from "../models/Workshop.js";

const getHostObjectId = (userId) => {
  return new mongoose.Types.ObjectId(String(userId));
};

const getStatusCount = (statusRows, status) => {
  return statusRows.find((item) => item._id === status)?.count ?? 0;
};

export const getHostDashboard = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const hostObjectId = getHostObjectId(userId);

    const now = new Date();

    const [
      bookingStatusRows,
      revenueRows,
      pendingPayoutRows,
      workshops,
      revenueSeriesRows,
    ] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            host: hostObjectId,
          },
        },
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            host: hostObjectId,
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,

            gross: {
              $sum: "$grossAmount",
            },

            platformFee: {
              $sum: "$platformFee",
            },

            net: {
              $sum: "$hostNetAmount",
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            host: hostObjectId,

            paymentStatus: "paid",

            payoutStatus: {
              $in: ["pending", "available"],
            },
          },
        },
        {
          $group: {
            _id: null,

            amount: {
              $sum: "$hostNetAmount",
            },
          },
        },
      ]),

      Workshop.find({
        host: userId,
      })
        .select("status schedules")
        .lean(),

      Booking.aggregate([
        {
          $match: {
            host: hostObjectId,
            paymentStatus: "paid",
            paidAt: {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$paidAt",

                timezone: "Asia/Ho_Chi_Minh",
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
            _id: -1,
          },
        },
        {
          $limit: 6,
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    const revenue = revenueRows[0] ?? {
      gross: 0,
      platformFee: 0,
      net: 0,
    };

    const upcomingSessions = workshops.flatMap((workshop) =>
      workshop.schedules.filter((schedule) => new Date(schedule.startAt) > now),
    );

    const emptySessions = upcomingSessions.filter(
      (schedule) => schedule.spotsLeft === schedule.seatsTotal,
    ).length;

    const lowFillSessions = upcomingSessions.filter((schedule) => {
      const booked = schedule.seatsTotal - schedule.spotsLeft;

      if (booked <= 0 || schedule.seatsTotal <= 0) {
        return false;
      }

      return booked / schedule.seatsTotal < 0.3;
    }).length;

    return res.status(200).json({
      summary: {
        revenue: {
          gross: revenue.gross ?? 0,

          platformFee: revenue.platformFee ?? 0,

          net: revenue.net ?? 0,

          pendingPayout: pendingPayoutRows[0]?.amount ?? 0,
        },

        bookings: {
          total: bookingStatusRows.reduce(
            (total, item) => total + item.count,
            0,
          ),

          confirmed: getStatusCount(bookingStatusRows, "confirmed"),

          checkedIn: getStatusCount(bookingStatusRows, "checked_in"),

          cancelled: getStatusCount(bookingStatusRows, "cancelled"),

          noShow: getStatusCount(bookingStatusRows, "no_show"),
        },

        workshops: {
          total: workshops.length,

          published: workshops.filter(
            (workshop) => workshop.status === "published",
          ).length,

          draft: workshops.filter((workshop) => workshop.status === "draft")
            .length,

          upcomingSessions: upcomingSessions.length,

          emptySessions,

          lowFillSessions,
        },

        revenueSeries: revenueSeriesRows.map((item) => ({
          label: item._id,
          gross: item.gross ?? 0,
          net: item.net ?? 0,
        })),
      },
    });
  } catch (error) {
    console.error("Get host dashboard error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải dashboard host",
    });
  }
};

export const getHostWorkshops = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const hostObjectId = getHostObjectId(userId);

    const [workshops, bookingStats] = await Promise.all([
      Workshop.find({
        host: userId,
      })
        .select("title categories thumbnail status schedules createdAt")
        .sort({
          createdAt: -1,
        })
        .lean(),

      Booking.aggregate([
        {
          $match: {
            host: hostObjectId,
          },
        },
        {
          $group: {
            _id: "$workshop",

            totalBookings: {
              $sum: 1,
            },

            totalRevenue: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$paymentStatus", "paid"],
                  },
                  "$grossAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const statMap = new Map(
      bookingStats.map((item) => [String(item._id), item]),
    );

    const now = new Date();

    const rows = workshops.map((workshop) => {
      const schedules = workshop.schedules ?? [];

      const upcoming = schedules
        .filter((schedule) => new Date(schedule.startAt) > now)
        .sort(
          (first, second) => new Date(first.startAt) - new Date(second.startAt),
        );

      const totalSeats = schedules.reduce(
        (total, schedule) => total + schedule.seatsTotal,
        0,
      );

      const totalBooked = schedules.reduce(
        (total, schedule) =>
          total + Math.max(0, schedule.seatsTotal - schedule.spotsLeft),
        0,
      );

      const stats = statMap.get(String(workshop._id));

      const nextSession = upcoming[0];

      return {
        _id: String(workshop._id),

        title: workshop.title,

        categories: workshop.categories ?? [],

        thumbnail: workshop.thumbnail ?? null,

        status: workshop.status,

        nextSession: nextSession
          ? {
              _id: String(nextSession._id),

              startAt: nextSession.startAt,

              seatsTotal: nextSession.seatsTotal,

              spotsLeft: nextSession.spotsLeft,
            }
          : null,

        occupancyRate:
          totalSeats > 0 ? Math.round((totalBooked / totalSeats) * 100) : 0,

        totalBookings: stats?.totalBookings ?? 0,

        totalRevenue: stats?.totalRevenue ?? 0,
      };
    });

    return res.status(200).json({
      workshops: rows,
    });
  } catch (error) {
    console.error("Get host workshops error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải workshop của host",
    });
  }
};

export const getHostBookings = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const bookings = await Booking.find({
      host: userId,
    })
      .select("-qrTokenHash")
      .populate({
        path: "workshop",
        select: "title",
      })
      .sort({
        createdAt: -1,
      })
      .limit(200)
      .lean();

    const rows = bookings.map((booking) => ({
      _id: String(booking._id),

      bookingCode: booking.bookingCode,

      attendeeName: booking.attendeeName,

      attendeeEmail: booking.attendeeEmail,

      workshopTitle: booking.workshop?.title ?? "Workshop đã xóa",

      sessionLabel: booking.sessionLabel,

      quantity: booking.quantity,

      grossAmount: booking.grossAmount,

      paymentStatus: booking.paymentStatus,

      status: booking.status,

      createdAt: booking.createdAt,

      checkedInAt: booking.checkedInAt ?? null,
    }));

    return res.status(200).json({
      bookings: rows,
    });
  } catch (error) {
    console.error("Get host bookings error:", error);

    return res.status(500).json({
      message: error.message ?? "Không thể tải booking của host",
    });
  }
};
