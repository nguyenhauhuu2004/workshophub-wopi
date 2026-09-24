import User from "../models/User.js";
import Workshop from "../models/Workshop.js";
import { sendWorkshopDiscoveryEmail } from "./emailService.js";

/**
 * Gửi email thông báo workshop đang mở cho người dùng.
 * Có thể chạy định kỳ hoặc gọi thủ công.
 */
export const runDiscoveryEmailNotification = async () => {
  try {
    const now = new Date();

    // 1. Tìm các workshop published đang có lịch sắp tới
    const openWorkshops = await Workshop.find({
      status: "published",
      "schedules.startAt": { $gt: now },
    })
      .select("title thumbnail price location duration schedules")
      .limit(10)
      .lean();

    if (!openWorkshops.length) {
      console.log("[SCHEDULER] Không có workshop nào đang mở lịch sắp tới.");
      return { sentCount: 0, message: "Không có workshop phù hợp" };
    }

    // 2. Tìm danh sách người dùng active có email
    const users = await User.find({
      email: { $exists: true, $ne: "" },
      status: "active",
    })
      .select("email displayName")
      .lean();

    if (!users.length) {
      console.log("[SCHEDULER] Không tìm thấy người dùng nhận email.");
      return { sentCount: 0, message: "Không tìm thấy người dùng" };
    }

    console.log(
      `[SCHEDULER] Bắt đầu gửi email thông báo cho ${users.length} người dùng với ${openWorkshops.length} workshop...`,
    );

    let sentCount = 0;
    for (const user of users) {
      if (user.email) {
        try {
          await sendWorkshopDiscoveryEmail(user.email, openWorkshops);
          sentCount++;
        } catch (sendErr) {
          console.error(
            `[SCHEDULER] Lỗi gửi email tới ${user.email}:`,
            sendErr,
          );
        }
      }
    }

    console.log(
      `[SCHEDULER] Hoàn tất gửi email khám phá workshop cho ${sentCount}/${users.length} người dùng.`,
    );
    return { sentCount, totalUsers: users.length };
  } catch (error) {
    console.error(
      "[SCHEDULER] Lỗi trong quá trình chạy notification scheduler:",
      error,
    );
    throw error;
  }
};

/**
 * Khởi động scheduler chạy ngầm định kỳ
 * Mặc định: chạy mỗi 3 ngày (72 giờ)
 */
export const startNotificationScheduler = () => {
  const intervalHours =
    Number(process.env.DISCOVERY_EMAIL_INTERVAL_HOURS) || 72;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(
    `[SCHEDULER] Đã khởi động Notification Scheduler (chạy mỗi ${intervalHours} giờ).`,
  );

  // Chạy định kỳ
  setInterval(() => {
    runDiscoveryEmailNotification().catch((err) =>
      console.error(
        "[SCHEDULER] Lỗi trong timer runDiscoveryEmailNotification:",
        err,
      ),
    );
  }, intervalMs);
};
