import {
  PLATFORM_KNOWLEDGE,
  buildSystemPrompt,
} from "../config/platformKnowledge.js";

// Sử dụng các model Gemini Flash tối ưu tốc độ và độ phản hồi cao
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
];

// Bộ nhớ cache tạm trạng thái hết credit để không lặp lại request chậm chạp
let cachedDepletedKey = null;
let cachedDepletedUntil = 0;

/**
 * Trả lời thông minh, tự nhiên và linh hoạt dựa trên tri thức nội bộ WoPi
 * khi Gemini API gặp sự cố quota, mất kết nối hoặc phản hồi chậm.
 */
const getKnowledgeFallback = (query) => {
  const q = (query || "").toLowerCase().trim();

  // 1. Người dùng muốn trở thành Host / Mở lớp / Hợp tác tổ chức
  if (
    q.includes("lam host") ||
    q.includes("làm host") ||
    q.includes("tro thanh host") ||
    q.includes("trở thành host") ||
    q.includes("mo workshop") ||
    q.includes("mở workshop") ||
    q.includes("to chuc workshop") ||
    q.includes("tổ chức workshop") ||
    q.includes("hop tac") ||
    q.includes("hợp tác") ||
    q.includes("dang ky host") ||
    q.includes("đăng ký host") ||
    q.includes("nghe nhan") ||
    q.includes("nghệ nhân") ||
    q.includes("host")
  ) {
    return (
      "### Chào mừng bạn gia nhập cộng đồng Host tại WoPi! 🌟\n\n" +
      "WoPi luôn chào đón những nghệ nhân, chuyên gia và người truyền cảm hứng cùng mở workshop sáng tạo! Để trở thành Host, bạn có thể kết nối ngay với đội ngũ WoPi qua các kênh sau nhé:\n\n" +
      "- 📞 **Hotline / SĐT:** `0909 123 456` hoặc `1900 6868`\n" +
      "- 💬 **Zalo hỗ trợ Host (24/7):** `0909 123 456` *(Zalo WOPI Workshop)*\n" +
      "- ✉️ **Email tiếp nhận hồ sơ:** [host@wopi.life](mailto:host@wopi.life) hoặc [support@wopi.life](mailto:support@wopi.life)\n" +
      "- 🌐 **Đăng ký online:** Bạn có thể đăng ký tài khoản và chọn vai trò **'Nghệ nhân / Host'** tại trang **[Đăng ký ngay](/signup)**, sau đó truy cập **[Bảng điều khiển Host](/host)** để quản lý workshop.\n\n" +
      "**Quyền lợi khi đồng hành cùng WoPi:**\n" +
      "✨ Tiếp cận hàng nghìn học viên yêu thích nghệ thuật & thủ công.\n" +
      "📅 Công cụ tạo lịch lặp lại thông minh theo thứ trong tuần linh hoạt.\n" +
      "🔥 Tùy chỉnh giảm giá trực tiếp trên card và phát hành mã voucher ưu đãi.\n" +
      "📱 Quét mã QR check-in học viên nhanh chỉ trong 3 giây.\n\n" +
      "> Đội ngũ WoPi sẽ liên hệ và hỗ trợ bạn setup workshop, hình ảnh và truyền thông trong vòng 24h làm việc!"
    );
  }

  // 2. Thanh toán & Thuế VAT
  if (
    q.includes("thanh toan") ||
    q.includes("thanh toán") ||
    q.includes("vietqr") ||
    q.includes("chuyen khoan") ||
    q.includes("chuyển khoản") ||
    q.includes("tien mat") ||
    q.includes("tiền mặt") ||
    q.includes("vat") ||
    q.includes("thue") ||
    q.includes("thuế") ||
    q.includes("phi") ||
    q.includes("phí")
  ) {
    return (
      "### Phương thức thanh toán tiện lợi tại WoPi 💳\n\n" +
      "WoPi hỗ trợ 2 hình thức thanh toán an toàn và linh hoạt cho bạn lựa chọn:\n\n" +
      "1. 📲 **Chuyển khoản QR (VietQR):** Quét mã QR thanh toán nhanh 24/7 qua bất kỳ ứng dụng ngân hàng nào. Hệ thống tự động xác nhận và phát hành vé điện tử tức thì.\n" +
      "2. 💵 **Thanh toán tại workshop:** Đặt chỗ nhận vé trước hoàn toàn miễn phí, sau đó thanh toán trực tiếp cho Host khi bạn đến tham gia buổi học.\n\n" +
      "🎉 **Đặc biệt:** WoPi áp dụng **chính sách 0% thuế VAT** cho toàn bộ học viên! Bạn chỉ cần thanh toán đúng giá vé đã niêm yết (hoặc giá đã giảm), tuyệt đối không phát sinh phụ phí ẩn."
    );
  }

  // 3. Giảm giá, Khuyến mãi & Voucher
  if (
    q.includes("giam gia") ||
    q.includes("giảm giá") ||
    q.includes("voucher") ||
    q.includes("khuyen mai") ||
    q.includes("khuyến mãi") ||
    q.includes("ma giam") ||
    q.includes("mã giảm") ||
    q.includes("coupon") ||
    q.includes("uu dai") ||
    q.includes("ưu đãi")
  ) {
    return (
      "### Ưu đãi & Giảm giá hấp dẫn tại WoPi 🔥\n\n" +
      "Tại WoPi, bạn có thể nhận ưu đãi qua 2 hình thức cực kỳ trực quan:\n\n" +
      "- 🔥 **Giảm giá trực tiếp:** Hiển thị nổi bật ngay trên card workshop (gạch ngang giá gốc kèm huy hiệu ngọn lửa ưu đãi như *-20%*, *-50.000đ*). Giá khi bạn bấm đặt vé sẽ được tự động trừ thẳng cực kỳ tiết kiệm!\n" +
      "- 🏷️ **Mã giảm giá (Voucher):** Nhập mã khuyến mãi do Host hoặc WoPi phát hành ở bước đặt chỗ để nhận thêm chiết khấu theo % hoặc số tiền cố định.\n\n" +
      "> Bạn hãy ghé thăm trang chủ thường xuyên để săn các workshop đang có gắn nhãn ưu đãi giờ vàng nhé!"
    );
  }

  // 4. Tư vấn chọn workshop theo nhu cầu, tâm trạng
  if (
    q.includes("hen ho") ||
    q.includes("hẹn hò") ||
    q.includes("cap doi") ||
    q.includes("cặp đôi") ||
    q.includes("nguoi yeu") ||
    q.includes("người yêu") ||
    q.includes("nhom") ||
    q.includes("nhóm") ||
    q.includes("ban be") ||
    q.includes("bạn bè") ||
    q.includes("stress") ||
    q.includes("thu gian") ||
    q.includes("thư giãn") ||
    q.includes("xa stress") ||
    q.includes("xả stress") ||
    q.includes("moi bat dau") ||
    q.includes("mới bắt đầu") ||
    q.includes("goi y") ||
    q.includes("gợi ý") ||
    q.includes("tu van") ||
    q.includes("tư vấn")
  ) {
    return (
      "### Gợi ý workshop lý tưởng theo sở thích của bạn ✨\n\n" +
      "Mình có một số gợi ý tuyệt vời dành riêng cho bạn đây:\n\n" +
      "- 💑 **Dành cho cặp đôi / Hẹn hò lãng mạn:** Thử ngay workshop **Làm gốm đôi**, **Vẽ tranh cùng nhau** hoặc **Làm nến thơm** tự mix mùi hương kỷ niệm của hai bạn.\n" +
      "- 👥 **Đi cùng nhóm bạn thân:** Rủ bạn bè tham gia **Làm bánh ngọt / Pizza**, **Pha chế cocktail / cà phê thủ công**, hoặc thử sức làm mộc DIY độc đáo.\n" +
      "- 🌿 **Xả stress & Chữa lành tâm hồn:** Đắm chìm vào **Vẽ tranh màu nước**, **Cắm hoa phong cách Hàn Quốc**, **Đan len móc** hoặc buổi thiền **Yoga & Chuông xoay** an yên.\n" +
      "- 🎨 **Người mới bắt đầu (Beginners):** Rất thích hợp với **Làm nến thơm hoa khô**, **Khảm mosaic nghệ thuật** hoặc **Nặn gốm tự do** — các Host đều hướng dẫn cực kỳ tận tình từ A-Z!\n\n" +
      "Bạn thích phong cách nào nhất? Hãy nhắn mình thể loại cụ thể để mình gợi ý chi tiết hơn nhé!"
    );
  }

  // 5. Quy trình đặt chỗ & Số điện thoại
  if (
    q.includes("dat cho") ||
    q.includes("đặt chỗ") ||
    q.includes("dat ve") ||
    q.includes("đặt vé") ||
    q.includes("so dien thoai") ||
    q.includes("số điện thoại") ||
    q.includes("sdt") ||
    q.includes("sđt") ||
    q.includes("quy trinh") ||
    q.includes("quy trình")
  ) {
    return (
      "### Hướng dẫn đặt chỗ workshop 🎫\n\n" +
      "Quy trình đặt chỗ trên WoPi vô cùng nhanh chóng chỉ với vài bước:\n\n" +
      "1. Chọn workshop bạn thích và bấm vào ngày/khung giờ còn chỗ trống.\n" +
      "2. Chọn số lượng người tham dự.\n" +
      "3. Điền thông tin: Họ tên, Email và **Số điện thoại** (*bắt buộc* để Host liên hệ xác nhận & hướng dẫn khi đến lớp).\n" +
      "4. Nhập mã voucher ưu đãi (nếu có) và chọn hình thức thanh toán (VietQR hoặc Thanh toán tại workshop).\n" +
      "5. Bấm **'Đặt chỗ & Nhận vé ngay'** để hoàn tất!\n\n" +
      "> 💡 **Mẹo:** Trên điện thoại, bạn có thể bấm nút **Đặt chỗ ngay** nổi ở góc dưới để mở thanh đặt chỗ tiện lợi bất cứ lúc nào."
    );
  }

  // 6. Vé điện tử, Check-in & Hủy chỗ
  if (
    q.includes("ve") ||
    q.includes("vé") ||
    q.includes("check in") ||
    q.includes("check-in") ||
    q.includes("checkin") ||
    q.includes("huy") ||
    q.includes("hủy") ||
    q.includes("hoan tien") ||
    q.includes("hoàn tiền")
  ) {
    return (
      "### Vé điện tử & Chính sách Hủy chỗ miễn phí 📱\n\n" +
      "- **Nhận vé tức thì:** Ngay sau khi đặt thành công, vé điện tử kèm mã QR check-in được gửi vào Email và lưu trữ tại mục **[Đơn đặt chỗ của tôi](/my-bookings)**.\n" +
      "- **Check-in 3 giây:** Khi đến buổi workshop, bạn chỉ cần mở mã QR trên điện thoại để Host quét mã xác nhận tham dự.\n" +
      "- **Hủy chỗ linh hoạt:** Nếu có việc đột xuất, bạn có thể **tự bấm 'Hủy đơn'** trực tiếp trong trang quản lý vé bất cứ lúc nào trước giờ tổ chức. Hoàn toàn miễn phí và không bị phạt!"
    );
  }

  // 7. Danh mục workshop
  if (
    q.includes("danh muc") ||
    q.includes("danh mục") ||
    q.includes("the loai") ||
    q.includes("thể loại") ||
    q.includes("cac loai") ||
    q.includes("các loại")
  ) {
    const list = PLATFORM_KNOWLEDGE.categories
      .slice(0, 10)
      .map((c) => `• **${c.name}:** ${c.desc}`)
      .join("\n");
    return (
      "### Khám phá 17 danh mục workshop đa dạng tại WoPi 🎨\n\n" +
      list +
      "\n• Và nhiều thể loại độc đáo khác như: *Nhiếp ảnh, Pha chế, Yoga & Thiền, Thủ công DIY, Khác...*\n\n" +
      "👉 Bạn có thể lọc nhanh theo danh mục ngay trên thanh điều hướng trang chủ nhé!"
    );
  }

  // 8. Vị trí, Bản đồ & Tìm kiếm Gần tôi
  if (
    q.includes("chi duong") ||
    q.includes("chỉ đường") ||
    q.includes("ban do") ||
    q.includes("bản đồ") ||
    q.includes("gan toi") ||
    q.includes("gần tôi") ||
    q.includes("dia chi") ||
    q.includes("địa chỉ") ||
    q.includes("o dau") ||
    q.includes("ở đâu")
  ) {
    return (
      "### Tìm kiếm & Chỉ đường thông minh 📍\n\n" +
      "- **Tính năng 'Gần tôi':** Bật định vị vị trí để WoPi tự động tính toán khoảng cách (km) và sắp xếp các workshop gần bạn nhất.\n" +
      "- **Bản đồ Goong Maps:** Xem tọa độ chính xác của từng workshop trên bản đồ tương tác.\n" +
      "- **Nút 'Chỉ đường':** Bấm một chạm trên trang chi tiết để mở ngay Google Maps hoặc Apple Maps dẫn đường đến tận nơi."
    );
  }

  // Mặc định: Phản hồi thân thiện, cởi mở và linh hoạt
  return (
    `### Xin chào bạn! Mình là Trợ lý ảo WoPi ✨\n\n` +
    `Rất vui được đồng hành cùng bạn! Mình có thể giải đáp mọi thắc mắc và gợi ý những trải nghiệm tuyệt vời nhất tại WoPi:\n\n` +
    `🎨 **Tư vấn workshop:** Gợi ý hoạt động hẹn hò cặp đôi, đi nhóm bạn, xả stress cuối tuần.\n` +
    `🌟 **Dành cho Host:** Hướng dẫn mở workshop, liên hệ Hotline/Zalo \`0909 123 456\`, Email \`host@wopi.life\`.\n` +
    `💳 **Thanh toán & Đặt vé:** Quét mã VietQR 24/7, thanh toán tại chỗ, chính sách 0% VAT.\n` +
    `🔥 **Ưu đãi:** Giảm giá trực tiếp trên thẻ workshop và mã voucher khuyến mãi.\n` +
    `📍 **Địa điểm:** Tìm workshop gần bạn và chỉ đường Goong Maps tiện lợi.\n\n` +
    `*Bạn đang quan tâm đến chủ đề nào, hãy chia sẻ cùng mình nhé!* 😊`
  );
};

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Nội dung tin nhắn không được để trống",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Nếu chưa có API key -> Trả lời ngay tức thì (0ms) từ tri thức nội bộ
    if (!apiKey) {
      return res.status(200).json({
        reply: getKnowledgeFallback(message),
      });
    }

    const now = Date.now();

    // 2. Nếu gần đây Google báo hết credit với key này -> Trả lời ngay tức thì (0ms)
    if (cachedDepletedKey === apiKey && now < cachedDepletedUntil) {
      return res.status(200).json({
        reply: getKnowledgeFallback(message),
      });
    }

    const systemInstructionText = buildSystemPrompt();

    // Chuẩn bị payload tối ưu
    const contents = [];

    // Lấy 6 lượt hội thoại gần nhất (3 cặp hỏi - đáp) để giữ mạch trò chuyện tự nhiên
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        if (item.text && item.role) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: String(item.text) }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000, // Đảm bảo câu trả lời phong phú, chi tiết và không bị ngắt quãng
      },
    };

    let replyText = null;
    let lastError = null;

    // Thử lần lượt các model với timeout 4.0s mỗi model để AI có đủ thời gian phản hồi tự nhiên
    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastError = data.error?.message || response.statusText;

          // Nếu lỗi là do hết credit hoặc quota -> Cache lại 2 phút để không làm chậm các câu sau
          if (
            lastError &&
            (lastError.includes("prepayment credits") ||
              lastError.includes("quota") ||
              lastError.includes("RESOURCE_EXHAUSTED"))
          ) {
            cachedDepletedKey = apiKey;
            cachedDepletedUntil = Date.now() + 120_000;
            break;
          }
        }
      } catch (callErr) {
        lastError = callErr.message;
        // Bỏ qua và chuyển sang model/fallback ngay lập tức
      }
    }

    // Nếu Gemini không phản hồi -> Kích hoạt Knowledge Fallback siêu tốc
    if (!replyText) {
      return res.status(200).json({
        reply: getKnowledgeFallback(message),
      });
    }

    return res.status(200).json({
      reply: replyText,
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return res.status(200).json({
      reply: getKnowledgeFallback(req.body?.message || ""),
    });
  }
};
