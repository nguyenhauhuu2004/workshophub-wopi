/**
 * Email Service – Gửi email thông báo qua Resend API.
 *
 * Luồng email:
 * 1. Khi tạo payment (VietQR) → gửi hướng dẫn thanh toán + QR chuyển khoản
 * 2. Khi thanh toán thành công  → gửi vé + QR check-in
 * 3. Khi tạo booking            → thông báo cho host
 */

import { Resend } from "resend";

import User from "../models/User.js";
import { buildPaymentInstructionsHtml } from "../templates/bookingConfirmationTemplate.js";
import { buildTicketConfirmationHtml } from "../templates/ticketConfirmationTemplate.js";
import { buildHostNewBookingHtml } from "../templates/hostNewBookingTemplate.js";
import { buildWorkshopDiscoveryHtml } from "../templates/workshopDiscoveryTemplate.js";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY chưa được cấu hình, bỏ qua gửi email.");

    return null;
  }

  return new Resend(apiKey);
};

const getFromEmail = () => {
  return process.env.RESEND_FROM_EMAIL || "WOPI <noreply@wopi.life>";
};

const getClientUrl = () => {
  return process.env.CLIENT_URL || "http://localhost:5173";
};

/**
 * Khi Resend chưa verify domain (free tier / testing),
 * chỉ gửi được tới email chủ tài khoản.
 *
 * Đặt RESEND_DEV_EMAIL trong .env để redirect
 * tất cả email về địa chỉ đó khi đang test.
 *
 * Khi đã verify domain, xoá biến này để gửi
 * tới email thật của người nhận.
 */
const resolveRecipient = (originalEmail) => {
  const devEmail = process.env.RESEND_DEV_EMAIL;

  if (devEmail) {
    console.log(
      `[EMAIL] Dev mode: redirect ${originalEmail} → ${devEmail}`,
    );

    return devEmail;
  }

  return originalEmail;
};

/**
 * Lấy workshop title từ booking (đã populate hoặc chưa).
 */
const getWorkshopTitle = (booking) => {
  return typeof booking.workshop === "object"
    ? booking.workshop.title || "Workshop"
    : "Workshop";
};

/* ─────────────────────────────────────────────
 * 1. Email hướng dẫn thanh toán + QR chuyển khoản
 *    Gọi khi tạo payment (createOrGetPayment)
 * ───────────────────────────────────────────── */

/**
 * @param {Object} populatedBooking – Booking document đã populate workshop
 * @param {Object} payment          – Payment document chứa QR VietQR info
 */
export const sendPaymentInstructionsEmail = async (populatedBooking, payment) => {
  const resend = getResendClient();

  if (!resend) return;

  const attendeeEmail = populatedBooking.attendeeEmail;

  if (!attendeeEmail) {
    console.warn("[EMAIL] Booking không có attendeeEmail, bỏ qua.");

    return;
  }

  const html = buildPaymentInstructionsHtml({
    booking: populatedBooking,
    payment,
    clientUrl: getClientUrl(),
  });

  const workshopTitle = getWorkshopTitle(populatedBooking);

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [resolveRecipient(attendeeEmail)],
    subject: `💳 Hướng dẫn thanh toán – ${workshopTitle} | WOPI`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Gửi email hướng dẫn thanh toán thất bại:", error);
  } else {
    console.log(`[EMAIL] Đã gửi email thanh toán tới ${attendeeEmail}`);
  }
};

/* ─────────────────────────────────────────────
 * 2. Email vé + QR check-in
 *    Gọi khi thanh toán thành công (webhook / manual confirm)
 * ───────────────────────────────────────────── */

/**
 * @param {Object} populatedBooking – Booking document đã populate workshop
 */
export const sendTicketConfirmationEmail = async (populatedBooking) => {
  const resend = getResendClient();

  if (!resend) return;

  const attendeeEmail = populatedBooking.attendeeEmail;

  if (!attendeeEmail) {
    console.warn("[EMAIL] Booking không có attendeeEmail, bỏ qua.");

    return;
  }

  const html = buildTicketConfirmationHtml({
    booking: populatedBooking,
    clientUrl: getClientUrl(),
  });

  const workshopTitle = getWorkshopTitle(populatedBooking);

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [resolveRecipient(attendeeEmail)],
    subject: `🎫 Vé của bạn – ${workshopTitle} | WOPI`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Gửi email vé thất bại:", error);
  } else {
    console.log(`[EMAIL] Đã gửi vé tới ${attendeeEmail}`);
  }
};

/* ─────────────────────────────────────────────
 * 3. Thông báo cho host khi có đơn mới
 *    Gọi khi tạo booking
 * ───────────────────────────────────────────── */

/**
 * @param {Object} populatedBooking – Booking document đã populate workshop, host, user
 */
export const sendHostNewBookingNotification = async (populatedBooking) => {
  const resend = getResendClient();

  if (!resend) return;

  let hostEmail = null;

  if (typeof populatedBooking.host === "object" && populatedBooking.host?.email) {
    hostEmail = populatedBooking.host.email;
  } else {
    try {
      const hostUser = await User.findById(
        populatedBooking.host?._id || populatedBooking.host,
      ).select("email");

      hostEmail = hostUser?.email;
    } catch (err) {
      console.warn("[EMAIL] Không thể tìm email host:", err.message);
    }
  }

  if (!hostEmail) {
    console.warn("[EMAIL] Host không có email, bỏ qua thông báo.");

    return;
  }

  const workshopTitle = getWorkshopTitle(populatedBooking);

  const html = buildHostNewBookingHtml({
    booking: populatedBooking,
    clientUrl: getClientUrl(),
  });

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [resolveRecipient(hostEmail)],
    subject: `🔔 Đơn đặt chỗ mới – ${workshopTitle} | WOPI`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Gửi email thông báo host thất bại:", error);
  } else {
    console.log(`[EMAIL] Đã gửi thông báo đơn mới tới host ${hostEmail}`);
  }
};

/* ─────────────────────────────────────────────
 * 4. Email xác nhận đặt chỗ thành công (thanh toán tại workshop)
 *    Gọi ngay khi tạo booking pay_at_venue — không qua payment flow
 * ───────────────────────────────────────────── */

/**
 * @param {Object} populatedBooking – Booking document đã populate workshop
 */
export const sendPayAtVenueConfirmationEmail = async (populatedBooking) => {
  const resend = getResendClient();

  if (!resend) return;

  const attendeeEmail = populatedBooking.attendeeEmail;

  if (!attendeeEmail) {
    console.warn("[EMAIL] Booking không có attendeeEmail, bỏ qua.");
    return;
  }

  const html = buildTicketConfirmationHtml({
    booking: populatedBooking,
    clientUrl: getClientUrl(),
  });

  const workshopTitle = getWorkshopTitle(populatedBooking);

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [resolveRecipient(attendeeEmail)],
    subject: `🎫 Đặt chỗ thành công – ${workshopTitle} | WOPI`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Gửi email xác nhận đặt chỗ tại chỗ thất bại:", error);
  } else {
    console.log(`[EMAIL] Đã gửi email xác nhận pay_at_venue tới ${attendeeEmail}`);
  }
};

/* ─────────────────────────────────────────────
 * 5. Email khám phá workshop gần người dùng
 *    Gọi định kỳ để thông báo workshop đang mở
 * ───────────────────────────────────────────── */

/**
 * @param {string} recipientEmail – Email người nhận
 * @param {Array}  workshops      – Danh sách workshop đang mở
 */
export const sendWorkshopDiscoveryEmail = async (recipientEmail, workshops) => {
  const resend = getResendClient();

  if (!resend) return;

  if (!recipientEmail || !workshops?.length) {
    return;
  }

  const html = buildWorkshopDiscoveryHtml({
    workshops,
    clientUrl: getClientUrl(),
  });

  const count = workshops.length;

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [resolveRecipient(recipientEmail)],
    subject: `🎨 ${count} workshop đang mở gần bạn — Khám phá ngay! | WOPI`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Gửi email khám phá workshop thất bại:", error);
  } else {
    console.log(`[EMAIL] Đã gửi email khám phá workshop tới ${recipientEmail}`);
  }
};
