/**
 * Template email xác nhận vé / thanh toán thành công gửi cho khách hàng.
 *
 * Bao gồm: thông tin vé tham gia, mã QR check-in điện tử,
 *          xác nhận thanh toán thành công, liên kết quản lý đặt chỗ.
 */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * @param {Object} params
 * @param {Object} params.booking   – Populated booking document
 * @param {string} params.clientUrl – Frontend URL
 */
export const buildTicketConfirmationHtml = ({ booking, clientUrl }) => {
  const workshop =
    typeof booking.workshop === "object" ? booking.workshop : {};
  const workshopTitle = workshop.title || "Workshop";
  const thumbnailUrl = workshop.thumbnail?.url || "";
  const locationAddress =
    workshop.location?.formattedAddress ||
    workshop.location?.address ||
    "Sẽ thông báo sau";
  const duration = workshop.duration || "";

  const sessionLabel =
    booking.sessionLabel ||
    (booking.sessionSnapshot?.startAt
      ? formatDate(booking.sessionSnapshot.startAt)
      : "—");

  const bookingCode = booking.bookingCode || "—";
  const attendeeName = booking.attendeeName || "Quý khách";
  const attendeeEmail = booking.attendeeEmail || "";
  const attendeePhone = booking.attendeePhone || "";
  const quantity = booking.quantity || 1;
  const grossAmount = booking.grossAmount ?? 0;
  const paidAt = booking.paidAt || booking.updatedAt || new Date();
  const paidAtFormatted = formatDate(paidAt);

  const isPayAtVenue = booking.paymentMethod === "pay_at_venue";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=WOPY_CHECKIN:${bookingCode}`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vé điện tử &amp; Xác nhận đặt chỗ – WOPI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">WOPI</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Workshop Platform</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 16px;">
              ${isPayAtVenue
    ? `<h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">🎉 Đặt chỗ thành công – Vé của bạn đã sẵn sàng!</h2>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                Xin chào <strong>${attendeeName}</strong>, bạn đã đặt chỗ thành công.
                Vui lòng <strong>thanh toán trực tiếp tại workshop</strong>. Dưới đây là thông tin vé điện tử và mã QR check-in của bạn.
              </p>`
    : `<h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">🎉 Thanh toán thành công – Vé của bạn đã sẵn sàng!</h2>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                Xin chào <strong>${attendeeName}</strong>, cảm ơn bạn đã hoàn tất thanh toán.
                Dưới đây là thông tin vé điện tử và chi tiết đơn đặt chỗ của bạn.
              </p>`
  }
            </td>
          </tr>

          <!-- Booking Info Card -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                ${
                  thumbnailUrl
                    ? `
                <tr>
                  <td colspan="2" style="padding:0;">
                    <img src="${thumbnailUrl}" alt="${workshopTitle}" width="520" style="width:100%;height:auto;display:block;border-radius:10px 10px 0 0;" />
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td colspan="2" style="padding:20px 24px 8px;">
                    <h3 style="margin:0;font-size:18px;color:#1a1a2e;">${workshopTitle}</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;width:140px;color:#64748b;font-size:14px;">Mã booking</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;color:#6366f1;letter-spacing:0.5px;">${bookingCode}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Lịch workshop</td>
                  <td style="padding:4px 24px;font-size:14px;">${sessionLabel}</td>
                </tr>
                ${
                  duration
                    ? `
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Thời lượng</td>
                  <td style="padding:4px 24px;font-size:14px;">${duration}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Địa điểm</td>
                  <td style="padding:4px 24px;font-size:14px;">${locationAddress}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Số lượng vé</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;">${quantity}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Người tham gia</td>
                  <td style="padding:4px 24px;font-size:14px;">${attendeeName}${attendeeEmail ? ` (${attendeeEmail})` : ""}</td>
                </tr>
                ${attendeePhone ? `
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Số điện thoại</td>
                  <td style="padding:4px 24px;font-size:14px;">${attendeePhone}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Thanh toán</td>
                  <td style="padding:4px 24px;font-size:14px;">
                    ${isPayAtVenue
    ? `<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid #fde68a;">💵 Thanh toán tại workshop</span>`
    : `<span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid #a7f3d0;">✅ Đã thanh toán QR</span>`
  }
                  </td>
                </tr>
                <tr><td colspan="2" style="padding:8px;"></td></tr>
              </table>
            </td>
          </tr>


          <!-- QR Check-in Card -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #10b981;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(16,185,129,0.12);">
                <!-- Card Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#059669,#10b981);padding:16px 24px;text-align:center;">
                    <h3 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">
                      🎫 Vé điện tử của bạn
                    </h3>
                  </td>
                </tr>

                <!-- QR Code Image -->
                <tr>
                  <td style="padding:28px 24px 16px;text-align:center;">
                    <div style="display:inline-block;background:#ffffff;padding:16px;border-radius:12px;border:1px solid #a7f3d0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                      <img src="${qrImageUrl}" alt="Mã QR Check-in" width="240" height="240" style="width:240px;height:240px;display:block;margin:0 auto;border-radius:6px;" />
                    </div>
                  </td>
                </tr>

                <!-- Prominent Booking Code -->
                <tr>
                  <td style="padding:0 24px 12px;text-align:center;">
                    <div style="display:inline-block;background:#ffffff;border:1.5px dashed #059669;border-radius:8px;padding:8px 24px;">
                      <span style="display:block;font-size:11px;font-weight:600;color:#047857;letter-spacing:1px;text-transform:uppercase;">MÃ ĐẶT CHỖ / BOOKING CODE</span>
                      <span style="font-size:22px;font-weight:700;color:#065f46;letter-spacing:1.5px;font-family:Consolas,monaco,monospace;">${bookingCode}</span>
                    </div>
                  </td>
                </tr>

                <!-- Instructions -->
                <tr>
                  <td style="padding:0 24px 8px;text-align:center;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#065f46;">
                      Xuất trình mã QR này tại quầy check-in
                    </p>
                  </td>
                </tr>

                <!-- QR Data Note -->
                <tr>
                  <td style="padding:0 28px 20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#047857;line-height:1.6;">
                      Mã QR chứa dữ liệu: <code style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:11px;font-family:monospace;border:1px solid #bbf7d0;">WOPY_CHECKIN:${bookingCode}</code><br/>
                      Vui lòng lưu vé về máy hoặc xuất trình mã này khi tới tham gia sự kiện.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Confirmed Summary -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="padding:14px 24px;background:#ecfdf5;border-bottom:1px solid #bbf7d0;">
                    <h3 style="margin:0;font-size:15px;font-weight:700;color:#065f46;">
                      ✅ Đã thanh toán thành công
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 6px;color:#64748b;font-size:14px;width:160px;">Số tiền</td>
                  <td style="padding:16px 24px 6px;font-size:18px;font-weight:700;color:#059669;text-align:right;">${formatCurrency(grossAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 24px 16px;color:#64748b;font-size:14px;">Thời gian</td>
                  <td style="padding:6px 24px 16px;font-size:14px;color:#1e293b;text-align:right;font-weight:500;">${paidAtFormatted}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${clientUrl}/bookings" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Xem vé & Đơn đặt chỗ
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Email này được gửi tự động từ WOPI Workshop Platform.<br/>
                Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ qua email hoặc trên nền tảng.<br/>
                © ${new Date().getFullYear()} WOPI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
