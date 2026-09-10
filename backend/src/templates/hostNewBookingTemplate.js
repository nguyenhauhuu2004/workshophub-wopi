/**
 * Template email thông báo cho host khi có đơn đặt chỗ mới.
 */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * @param {Object} params
 * @param {Object} params.booking   – Populated booking document
 * @param {string} params.clientUrl – Frontend URL
 */
export const buildHostNewBookingHtml = ({ booking, clientUrl }) => {
  const workshop =
    typeof booking.workshop === "object" ? booking.workshop : {};
  const workshopTitle = workshop.title || "Workshop";
  const locationAddress =
    workshop.location?.formattedAddress ||
    workshop.location?.address ||
    "—";

  const sessionLabel = booking.sessionLabel || "—";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đơn đặt chỗ mới – WOPI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">WOPI</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Thông báo cho Host</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">🔔 Bạn có đơn đặt chỗ mới!</h2>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                Có khách hàng vừa đặt chỗ cho workshop <strong>"${workshopTitle}"</strong> của bạn.
              </p>
            </td>
          </tr>

          <!-- Customer & Booking Info -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
                <tr>
                  <td colspan="2" style="padding:16px 24px 8px;">
                    <h3 style="margin:0;font-size:15px;color:#166534;">👤 Thông tin khách hàng</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;width:140px;color:#64748b;font-size:14px;">Tên</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;">${booking.attendeeName}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Email</td>
                  <td style="padding:4px 24px;font-size:14px;">${booking.attendeeEmail}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Số vé</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;">${booking.quantity}</td>
                </tr>
                <tr><td colspan="2" style="padding:8px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Workshop Details -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td colspan="2" style="padding:16px 24px 8px;">
                    <h3 style="margin:0;font-size:15px;color:#1a1a2e;">📋 Chi tiết đơn hàng</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;width:140px;color:#64748b;font-size:14px;">Mã booking</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;color:#6366f1;">${booking.bookingCode}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Workshop</td>
                  <td style="padding:4px 24px;font-size:14px;font-weight:600;">${workshopTitle}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Lịch</td>
                  <td style="padding:4px 24px;font-size:14px;">${sessionLabel}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Địa điểm</td>
                  <td style="padding:4px 24px;font-size:14px;">${locationAddress}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 24px;"><hr style="border:none;border-top:1px solid #e2e8f0;" /></td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Tổng đơn hàng</td>
                  <td style="padding:4px 24px;font-size:14px;">${formatCurrency(booking.grossAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 24px;color:#64748b;font-size:14px;">Phí nền tảng</td>
                  <td style="padding:4px 24px;font-size:14px;color:#ef4444;">-${formatCurrency(booking.platformFee)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 24px;font-size:15px;font-weight:700;color:#059669;">Bạn nhận được</td>
                  <td style="padding:8px 24px;font-size:16px;font-weight:700;color:#059669;">${formatCurrency(booking.hostNetAmount)}</td>
                </tr>
                <tr><td colspan="2" style="padding:4px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Status Note -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde047;border-radius:10px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⏳ Đơn đặt chỗ đang ở trạng thái <strong>chờ thanh toán</strong>.
                      Bạn sẽ nhận được thông báo khi khách hàng hoàn tất thanh toán.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${clientUrl}/host/dashboard" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Xem trên Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Email này được gửi tự động từ WOPI Workshop Platform.<br/>
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
