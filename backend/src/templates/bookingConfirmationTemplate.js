/**
 * Template email hướng dẫn thanh toán gửi cho khách hàng.
 *
 * Bao gồm:  thông tin vé, chi tiết thanh toán,
 *            QR VietQR chuyển khoản, lưu ý thời hạn thanh toán.
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
 * @param {Object} params.booking      – Populated booking document
 * @param {Object} params.payment      – Payment document (chứa QR info)
 * @param {string} params.clientUrl    – Frontend URL
 */
export const buildPaymentInstructionsHtml = ({
  booking,
  payment,
  clientUrl,
}) => {
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
    formatDate(booking.sessionSnapshot?.startAt) ||
    "—";

  const bankAccount = payment?.bankAccount || {};
  const qrImageUrl = payment?.qrDataURL || "";
  const paymentReference = payment?.paymentReference || "";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hướng dẫn thanh toán – WOPI</title>
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
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">💳 Hướng dẫn thanh toán</h2>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                Xin chào <strong>${booking.attendeeName}</strong>, đơn đặt chỗ của bạn đã được tạo.
                Vui lòng thanh toán theo hướng dẫn bên dưới để hoàn tất.
              </p>
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
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;color:#6366f1;letter-spacing:0.5px;">${booking.bookingCode}</td>
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
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;">${booking.quantity}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Người đặt</td>
                  <td style="padding:4px 24px;font-size:14px;">${booking.attendeeName} (${booking.attendeeEmail})</td>
                </tr>
                <tr><td colspan="2" style="padding:8px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h3 style="margin:0 0 12px;font-size:16px;color:#1a1a2e;">💰 Chi tiết thanh toán</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:12px 24px;color:#64748b;font-size:14px;">Đơn giá</td>
                  <td style="padding:12px 24px;font-size:14px;text-align:right;">${formatCurrency(booking.unitPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Số lượng</td>
                  <td style="padding:4px 24px;font-size:14px;text-align:right;">× ${booking.quantity}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Tạm tính</td>
                  <td style="padding:4px 24px;font-size:14px;text-align:right;">${formatCurrency(booking.subtotal)}</td>
                </tr>
                ${
                  booking.discountAmount > 0
                    ? `
                <tr>
                  <td style="padding:4px 24px;color:#10b981;font-size:14px;">Giảm giá</td>
                  <td style="padding:4px 24px;font-size:14px;text-align:right;color:#10b981;">-${formatCurrency(booking.discountAmount)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td colspan="2" style="padding:8px 24px;"><hr style="border:none;border-top:1px solid #e2e8f0;" /></td>
                </tr>
                <tr>
                  <td style="padding:8px 24px;font-size:16px;font-weight:700;color:#1a1a2e;">Tổng thanh toán</td>
                  <td style="padding:8px 24px;font-size:18px;font-weight:700;color:#6366f1;text-align:right;">${formatCurrency(booking.grossAmount)}</td>
                </tr>
                <tr><td colspan="2" style="padding:4px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- VietQR Payment -->
          ${
            qrImageUrl
              ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <h3 style="margin:0 0 12px;font-size:16px;color:#1a1a2e;">📱 Chuyển khoản qua VietQR</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde047;border-radius:10px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <img src="${qrImageUrl}" alt="QR Chuyển khoản" width="280" style="width:280px;height:auto;display:inline-block;border-radius:8px;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 4px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#92400e;font-size:13px;width:140px;">Ngân hàng</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#78350f;">${bankAccount.bankName || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#92400e;font-size:13px;">Số tài khoản</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#78350f;">${bankAccount.accountNo || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#92400e;font-size:13px;">Chủ tài khoản</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#78350f;">${bankAccount.accountName || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#92400e;font-size:13px;">Số tiền</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#78350f;">${formatCurrency(booking.grossAmount)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#92400e;font-size:13px;">Nội dung CK</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:700;color:#dc2626;">${paymentReference}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px 16px;">
                    <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
                      ⚠️ Vui lòng chuyển khoản <strong>đúng số tiền</strong> và ghi <strong>đúng nội dung</strong> để hệ thống tự động xác nhận.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Warning Note -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde047;border-radius:10px;">
                <tr>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;line-height:1.5;">
                      ⏳ Đơn đặt chỗ sẽ tự động hủy nếu không thanh toán trong 15 phút.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${clientUrl}/bookings" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Xem thông tin thanh toán
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

// Giữ alias tương thích ngược nếu cần
export const buildBookingConfirmationHtml = buildPaymentInstructionsHtml;
