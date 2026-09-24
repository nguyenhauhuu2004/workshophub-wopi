/**
 * Template email thông báo workshop đang mở gần người dùng.
 */
export const buildWorkshopDiscoveryHtml = ({ workshops, clientUrl }) => {
  const workshopCount = workshops.length;

  const workshopCards = workshops
    .slice(0, 5)
    .map(
      (w) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="80" style="vertical-align: top;">
                <img src="${w.thumbnail?.url || ''}" alt="${w.title}" width="72" height="72" style="border-radius: 12px; object-fit: cover; display: block;" />
              </td>
              <td style="vertical-align: top; padding-left: 12px;">
                <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #1a1a1f;">${w.title}</p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">📍 ${w.location?.address || 'Chưa cập nhật'}</p>
                <p style="margin: 0; font-size: 13px; color: #FF6B00; font-weight: 600;">${new Intl.NumberFormat('vi-VN').format(w.price)}đ / người</p>
              </td>
              <td width="100" style="vertical-align: middle; text-align: right;">
                <a href="${clientUrl}/workshops/${w._id}" style="display: inline-block; padding: 8px 16px; background: #FF6B00; color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">Xem ngay</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00, #C05621); padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 32px;">🎨</p>
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: white;">Khám phá workshop gần bạn!</h1>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.85);">
                Hiện có <strong>${workshopCount} workshop</strong> đang mở đăng ký
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px 28px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                Xin chào! 👋<br/><br/>
                Có những workshop thú vị đang chờ bạn khám phá. Đừng bỏ lỡ cơ hội trải nghiệm và sáng tạo cùng cộng đồng WoPi!
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${workshopCards}
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${clientUrl}/workshops" style="display: inline-block; padding: 14px 36px; background: #FF6B00; color: white; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700;">Xem tất cả workshop →</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">WoPi — Nền tảng kết nối workshop trải nghiệm</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">Email này được gửi tự động. Vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
