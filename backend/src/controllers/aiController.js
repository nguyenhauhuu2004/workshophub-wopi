import {
  PLATFORM_KNOWLEDGE,
  buildSystemPrompt,
} from "../config/platformKnowledge.js";

// Sử dụng model Flash mới nhất và Flash-lite (tốc độ phản hồi nhanh nhất của Google)
const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

// Bộ nhớ cache tạm trạng thái hết credit để không lặp lại request chậm chạp
let cachedDepletedKey = null;
let cachedDepletedUntil = 0;

/**
 * Trả lời thông minh dựa trên tri thức nội bộ WoPi khi Gemini API
 * gặp sự cố quota, hết credit hoặc phản hồi chậm.
 */
const getKnowledgeFallback = (query) => {
  const q = query.toLowerCase().trim();

  // 1. Thanh toán
  if (
    q.includes("thanh toan") ||
    q.includes("thanh toán") ||
    q.includes("tien mat") ||
    q.includes("tiền mặt") ||
    q.includes("vietqr") ||
    q.includes("chuyen khoan") ||
    q.includes("chuyển khoản") ||
    q.includes("gia") ||
    q.includes("giá")
  ) {
    return (
      "### Chính sách thanh toán tại WoPi 💵\n\n" +
      "Hiện tại WoPi áp dụng phương thức **Thanh toán tại workshop** (tiền mặt) cực kỳ tiện lợi:\n\n" +
      "- **Không cần thanh toán trước:** Bạn chỉ cần chọn lịch và đặt chỗ, hệ thống sẽ xác nhận ngay lập tức.\n" +
      "- **Nhận vé tức thì:** Vé điện tử kèm mã QR check-in được gửi ngay vào email và lưu trong tài khoản của bạn.\n" +
      "- **Thanh toán tại chỗ:** Bạn chỉ cần trả tiền mặt trực tiếp cho Host khi đến tham gia workshop.\n" +
      "- *Lưu ý:* Cổng chuyển khoản VietQR hiện đang tạm ngưng bảo trì để nâng cấp trải nghiệm."
    );
  }

  // 2. Đặt chỗ & Số điện thoại
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
      "Quy trình đặt chỗ trên WoPi gồm các bước đơn giản sau:\n\n" +
      "1. Chọn workshop bạn yêu thích và chọn khung giờ còn chỗ trống.\n" +
      "2. Chọn số lượng người tham gia.\n" +
      "3. Điền thông tin người tham dự: Họ tên, Email và **Số điện thoại** (*bắt buộc* để Host liên hệ hỗ trợ).\n" +
      "4. Tích chọn *'Lưu thông tin này cho lần sau'* để hệ thống tự động điền ở những lần đặt kế tiếp.\n" +
      "5. Bấm **'Đặt chỗ & Nhận vé ngay'** để hoàn tất!\n\n" +
      "> 💡 **Mẹo:** Trên điện thoại, bạn có thể bấm nút **Đặt chỗ ngay** nổi ở dưới màn hình để mở nhanh khung đặt chỗ."
    );
  }

  // 3. Vé & Check-in
  if (
    q.includes("ve") ||
    q.includes("vé") ||
    q.includes("check in") ||
    q.includes("check-in") ||
    q.includes("checkin") ||
    q.includes("ma qr") ||
    q.includes("mã qr")
  ) {
    return (
      "### Vé điện tử & Quy trình Check-in 📱\n\n" +
      "- **Nhận vé:** Ngay sau khi đặt chỗ thành công, vé điện tử có mã QR check-in sẽ được gửi vào email của bạn.\n" +
      "- **Quản lý vé:** Bạn có thể xem lại toàn bộ vé đã đặt tại trang **[Đơn đặt chỗ của tôi](/my-bookings)**.\n" +
      "- **Cách check-in:** Khi đến buổi workshop, bạn chỉ cần mở vé trên điện thoại để Host quét mã QR xác nhận tham dự.\n" +
      "- Mỗi vé có một mã QR và mã booking riêng biệt để đảm bảo tính an toàn."
    );
  }

  // 4. Hủy đơn đặt chỗ
  if (
    q.includes("huy") ||
    q.includes("hủy") ||
    q.includes("hoan tien") ||
    q.includes("hoàn tiền") ||
    q.includes("khong di") ||
    q.includes("không đi")
  ) {
    return (
      "### Chính sách hủy đơn đặt chỗ 🔄\n\n" +
      "- **Chủ động hủy đơn:** Với các đơn thanh toán tại workshop, bạn có thể **tự bấm Hủy đơn bất cứ lúc nào trước khi check-in** tại trang **[Đơn đặt chỗ của tôi](/my-bookings)**.\n" +
      "- **Giải phóng chỗ:** Ngay khi bạn hủy đơn, chỗ trống sẽ tự động được hoàn trả lại cho workshop để người khác có thể đăng ký tham gia.\n" +
      "- Không phát sinh bất kỳ khoản phí phạt nào khi bạn hủy đơn trước giờ tổ chức."
    );
  }

  // 5. Host / Người tổ chức
  if (
    q.includes("host") ||
    q.includes("to chuc") ||
    q.includes("tổ chức") ||
    q.includes("tao workshop") ||
    q.includes("tạo workshop") ||
    q.includes("dang ky") ||
    q.includes("đăng ký") ||
    q.includes("doanh thu")
  ) {
    return (
      "### Dành cho Người tổ chức Workshop (Host) 🌟\n\n" +
      "WoPi cung cấp đầy đủ công cụ giúp Host quản lý và phát triển workshop dễ dàng:\n\n" +
      "1. **Tạo workshop mới:** Đăng tải nội dung, hình ảnh, video và thiết lập các lịch tổ chức tại mục **[Tạo workshop](/workshops/create)**.\n" +
      "2. **Trung tâm quản lý Host (`/host`):** Theo dõi biểu đồ doanh thu, danh sách khách hàng và số điện thoại người tham dự.\n" +
      "3. **Quét mã Check-in tại chỗ:** Công cụ quét mã QR trên điện thoại hoặc nhập mã vé để xác nhận khách đến và tự động cập nhật trạng thái đã thu tiền.\n" +
      "4. **Gói tài trợ quảng bá (Promotions):** Đẩy workshop lên vị trí nổi bật trên trang chủ để tiếp cận hàng nghìn khách hàng."
    );
  }

  // 6. Danh mục workshop
  if (
    q.includes("danh muc") ||
    q.includes("danh mục") ||
    q.includes("the loai") ||
    q.includes("thể loại") ||
    q.includes("gom") ||
    q.includes("gốm") ||
    q.includes("ve") ||
    q.includes("vẽ") ||
    q.includes("nen") ||
    q.includes("nến") ||
    q.includes("banh") ||
    q.includes("bánh") ||
    q.includes("da") ||
    q.includes("len")
  ) {
    const list = PLATFORM_KNOWLEDGE.categories
      .map((c) => `- **${c.name}:** ${c.desc}`)
      .join("\n");
    return (
      "### Các danh mục workshop nổi bật tại WoPi 🎨\n\n" +
      list +
      "\n\n> Hãy nhập tên workshop bạn yêu thích vào ô tìm kiếm trên trang chủ để xem các lịch tổ chức gần nhất nhé!"
    );
  }

  // 7. Vị trí & Chỉ đường
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
      "- **Tính năng 'Gần tôi':** WoPi tự động định vị GPS thiết bị của bạn và sắp xếp các workshop từ gần đến xa kèm khoảng cách thực tế (km/m).\n" +
      "- **Bản đồ tương tác Goong Maps:** Hiển thị vị trí chính xác của từng workshop.\n" +
      "- **Nút 'Chỉ đường':** Bấm vào nút chỉ đường trong trang chi tiết để tự động mở ứng dụng Google Maps hoặc Apple Maps trên điện thoại để điều hướng đường đi."
    );
  }

  // Mặc định: Giới thiệu tổng quan
  return (
    `### Xin chào bạn! Mình là Trợ lý ảo WoPi ✨\n\n` +
    `**${PLATFORM_KNOWLEDGE.generalInfo.name}** là nền tảng kết nối những người yêu thích sáng tạo và trải nghiệm thực tế.\n\n` +
    `Bạn có thể hỏi mình nhanh về các chủ đề sau:\n\n` +
    `- **Đặt chỗ & Thanh toán:** Cách chọn lịch, điền SĐT bắt buộc và thanh toán tiền mặt tại workshop.\n` +
    `- **Vé điện tử & Check-in:** Xem mã QR vé và cách quét mã khi đến nơi.\n` +
    `- **Dành cho Host:** Cách đăng ký tạo workshop và theo dõi doanh thu.\n` +
    `- **Tìm kiếm:** Cách tìm workshop theo khoảng cách gần tôi và chỉ đường bản đồ.\n\n` +
    `*Bạn có thể bấm vào các câu hỏi gợi ý bên dưới hoặc nhập câu hỏi cụ thể nhé!*`
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

    // Chỉ lấy 4 lượt hội thoại gần nhất để tối ưu token & tăng tốc độ sinh phản hồi
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-4);
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
        temperature: 0.6,
        maxOutputTokens: 800, // Giới hạn token để phản hồi nhanh hơn
      },
    };

    let replyText = null;
    let lastError = null;

    // Thử lần lượt các model với timeout chặt chẽ (tối đa 2.5s mỗi model)
    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

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
