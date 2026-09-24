/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TÀI LIỆU TRI THỨC NỀN TẢNG WOPI (WOPI PLATFORM KNOWLEDGE BASE)
 * ══════════════════════════════════════════════════════════════════════════════
 */

export const PLATFORM_KNOWLEDGE = {
  // 1. Thông tin chung & Kênh liên hệ
  generalInfo: {
    name: "WoPi - Workshop Platform",
    slogan: "Khám phá đam mê, kết nối sáng tạo",
    description:
      "WoPi là nền tảng kết nối hàng đầu giữa những Nghệ nhân / Người tổ chức workshop (Host) đầy đam mê và những người tham gia (Attendees) mong muốn trải nghiệm nghệ thuật, thủ công, làm bánh, ẩm thực, âm nhạc và phong cách sống.",
    website: "https://wopi.life",
    contactEmail: "support@wopi.life",
    hostEmail: "host@wopi.life",
    hotline: "0909 123 456 / 1900 6868",
    phone: "0909 123 456",
    zalo: "0909 123 456 (Zalo WOPI Workshop)",
    address: "TP. Hồ Chí Minh, Việt Nam",
    workingHours: "8:00 - 22:00 tất cả các ngày trong tuần",
  },

  // 2. Danh mục workshop đa dạng (17 thể loại)
  categories: [
    { name: "Làm gốm", desc: "Nặn gốm, vuốt gốm bàn xoay, vẽ men gốm nghệ thuật, làm ly tách thủ công" },
    { name: "Vẽ tranh", desc: "Vẽ màu nước, tranh acrylic, tranh sơn dầu, tranh canvas thư giãn" },
    { name: "Nấu ăn", desc: "Nấu món Á - Âu, ẩm thực truyền thống, món chay thanh lành, finger food" },
    { name: "Làm bánh", desc: "Bánh ngọt Pháp, macaron, bánh mì sourdough, bánh kem trang trí" },
    { name: "Âm nhạc", desc: "Lớp học guitar, ukulele, piano, thanh nhạc cơ bản, cảm thụ âm nhạc" },
    { name: "Cắm hoa", desc: "Cắm hoa phong cách Hàn Quốc/Châu Âu, bó hoa nghệ thuật, hoa khô" },
    { name: "Làm mộc", desc: "Chế tác đồ gỗ DIY, thìa dĩa gỗ, hộp gỗ vintage, đồ decor gia đình" },
    { name: "Nghệ thuật", desc: "Khảm mosaic, tranh cát, nghệ thuật resin, điêu khắc đất sét" },
    { name: "Thủ công DIY", desc: "Làm đồ tái chế sáng tạo, phụ kiện thủ công, đồ trang trí nhà cửa" },
    { name: "Handmade", desc: "Trang sức thủ công, xà phòng tự nhiên, thiệp và sổ tay handmade" },
    { name: "Làm nến thơm", desc: "Phối hương tinh dầu thiên nhiên, đổ sáp nến đậu nành, trang trí hoa khô" },
    { name: "Đan len & Thêu", desc: "Móc len amigurumi, đan khăn, thêu tay phong cách hiện đại" },
    { name: "Làm đồ da", desc: "Chế tác ví da thật, móc khóa, bao da điện thoại, dây đồng hồ khâu tay" },
    { name: "Nhiếp ảnh", desc: "Chụp ảnh máy ảnh cơ, chụp ảnh điện thoại, chỉnh màu Lightroom" },
    { name: "Pha chế", desc: "Pha chế cà phê thủ công (Pour-over, Cold brew), cocktail, mocktail, trà sữa" },
    { name: "Yoga & Thiền", desc: "Yoga thư giãn, chuông xoay Tây Tạng, thiền định giải tỏa căng thẳng" },
    { name: "Khác", desc: "Các hoạt động sáng tạo và workshop đặc biệt theo mùa lễ hội" },
  ],

  // 3. Chính sách & Dịch vụ dành cho Người tham gia (Học viên)
  forAttendees: {
    howToSearch: [
      "Tìm kiếm nhanh theo từ khóa tên workshop trên thanh tìm kiếm thông minh.",
      "Lọc theo danh mục yêu thích (Làm gốm, Vẽ tranh, Làm bánh, Nến thơm...).",
      "Lọc theo khoảng giá phù hợp với ngân sách cá nhân.",
      "Tìm kiếm theo khu vực địa phương (Quận/Huyện, Tỉnh/Thành phố).",
      "Tính năng 'Gần tôi': Định vị GPS chính xác và sắp xếp các workshop từ gần đến xa kèm khoảng cách thực tế (km/m).",
      "Bản đồ tương tác Goong Maps: Xem chính xác vị trí và bấm 'Chỉ đường' để mở Google Maps / Apple Maps chỉ đường trực tiếp.",
    ],
    howToBook: [
      "Bước 1: Chọn workshop yêu thích và chọn khung giờ / ngày tổ chức còn chỗ trống.",
      "Bước 2: Chọn số lượng người tham gia.",
      "Bước 3: Điền thông tin người tham dự (Họ tên, Email, và Số điện thoại là BẮT BUỘC để nhận vé và xác nhận).",
      "Bước 4: Nhập mã voucher giảm giá (nếu có) để nhận thêm ưu đãi.",
      "Bước 5: Chọn hình thức thanh toán (Chuyển khoản VietQR hoặc Thanh toán tại workshop).",
      "Bước 6: Bấm 'Xác nhận đặt chỗ' để nhận vé điện tử ngay lập tức.",
    ],
    paymentMethods: {
      vietqr: {
        name: "Chuyển khoản QR (VietQR)",
        status: "Hoạt động 24/7",
        details:
          "Quét mã VietQR chuyển khoản nhanh 24/7 qua ứng dụng ngân hàng bất kỳ. Hệ thống tự động xác nhận đơn và gửi vé điện tử tức thì.",
      },
      payAtVenue: {
        name: "Thanh toán tại workshop",
        status: "Hoạt động (Khuyên dùng)",
        details:
          "Không cần thanh toán trước online! Vé điện tử gửi ngay sau khi đặt. Bạn chỉ cần trả tiền mặt hoặc chuyển khoản cho Host khi đến tham gia.",
      },
      vatPolicy: "Miễn phí 100% thuế VAT (0% VAT). Người dùng thanh toán đúng giá vé đã niêm yết/đã giảm, không phát sinh phụ phí ẩn.",
    },
    discounts: {
      directDiscount: "Giảm giá trực tiếp hiển thị ngay trên Card workshop: Gạch ngang giá gốc, gắn huy hiệu ngọn lửa 🔥 (-20%, -50k...), giá thanh toán được tự động trừ thẳng.",
      voucherCode: "Mã giảm giá (Coupon Code): Nhập mã khuyến mãi lúc đặt vé để được giảm theo % hoặc số tiền cố định.",
    },
    ticketAndCheckIn: [
      "Sau khi đặt thành công, vé điện tử có mã QR check-in được gửi ngay vào Email.",
      "Xem và quản lý toàn bộ vé tại trang 'Đơn đặt chỗ của tôi' (/my-bookings).",
      "Khi đến workshop, mở mã QR trên điện thoại để Host quét mã check-in nhanh trong 3 giây.",
      "Trên điện thoại có thanh đặt chỗ nổi (Mobile drawer) giúp thao tác cực kỳ mượt mà.",
    ],
    cancellationPolicy: [
      "Người tham gia có thể tự bấm 'Hủy đơn' trực tiếp trong trang 'Đơn đặt chỗ của tôi' (/my-bookings) bất cứ lúc nào trước giờ tổ chức.",
      "Chỗ trống được tự động hoàn trả lại cho workshop, hoàn toàn không mất phí phạt.",
    ],
  },

  // 4. Chính sách & Kênh liên hệ dành cho Người tổ chức (Host)
  forHosts: {
    contactToBecomeHost: {
      hotline: "0909 123 456 hoặc 1900 6868",
      zalo: "0909 123 456 (Zalo WOPI Workshop - hỗ trợ 24/7)",
      email: "host@wopi.life hoặc support@wopi.life",
      onlineRegistration: "Đăng ký tài khoản trên WOPI và chọn vai trò 'Nghệ nhân / Host' tại trang /signup, sau đó truy cập /host.",
      supportPolicy: "Đội ngũ WOPI sẽ liên hệ hỗ trợ bạn kiểm duyệt hồ sơ trong vòng 24h, hướng dẫn đăng workshop, setup hình ảnh, hỗ trợ quảng bá và kết nối học viên.",
    },
    benefitsForHosts: [
      "Tiếp cận hàng nghìn học viên trẻ, năng động yêu thích sáng tạo và trải nghiệm.",
      "Hệ thống quản lý lịch thông minh: Hỗ trợ tạo lịch lặp lại theo thứ trong tuần (chọn nhiều thứ hoặc tất cả, nhiều ca giờ trong ngày, lặp theo nhiều tuần).",
      "Công cụ tạo giảm giá linh hoạt: Giảm trực tiếp trên card workshop hoặc tạo mã voucher khuyến mãi theo % hoặc số tiền.",
      "Bảng điều khiển Host (/host): Thống kê doanh thu, quản lý đơn đặt chỗ, thông tin khách hàng, số điện thoại.",
      "Công cụ quét mã QR Check-in tức thì trên điện thoại khi học viên đến lớp.",
      "Quảng bá nổi bật: Gói tài trợ promotion đẩy workshop lên trang chủ và đầu danh mục tìm kiếm.",
    ],
  },

  // 5. Gợi ý tư vấn thông minh theo nhu cầu (Recommendations)
  recommendations: {
    dating: "Hẹn hò lãng mạn cho cặp đôi: Làm gốm đôi (như phim Ghost), vẽ tranh thư giãn cùng thưởng trà, làm nến thơm đôi phối hương riêng của hai bạn.",
    groupFriends: "Đi chơi nhóm bạn: Làm bánh pizza/bánh ngọt, làm mộc DIY, pha chế cocktail/mocktail, làm đồ da handmade cùng nhau.",
    stressRelief: "Giải tỏa căng thẳng & thư giãn: Vẽ tranh màu nước, đan len móc, cắm hoa nghệ thuật, yoga chuông xoay thiền định.",
    beginners: "Cho người mới bắt đầu: Làm nến thơm, vẽ tranh canvas có hướng dẫn từng bước, nặn gốm tự do, cắm hoa bàn tiệc mini.",
  },

  // 6. Câu hỏi thường gặp (FAQ)
  faq: [
    {
      q: "Làm thế nào để trở thành Host trên WOPI?",
      a: "Để trở thành Host tổ chức workshop trên WOPI, bạn có thể liên hệ ngay với đội ngũ hỗ trợ qua Zalo/Hotline: 0909 123 456 hoặc 1900 6868, hoặc gửi email đến host@wopi.life. Ngoài ra bạn có thể đăng ký tài khoản online và chọn vai trò 'Host' tại trang Đăng ký (/signup)!",
    },
    {
      q: "WOPI có những hình thức thanh toán nào?",
      a: "WOPI hỗ trợ 2 hình thức thanh toán thuận tiện: 1) Chuyển khoản nhanh qua mã QR (VietQR) xác nhận tự động 24/7; 2) Thanh toán tiền mặt tại workshop khi đến tham gia.",
    },
    {
      q: "Tôi có phải trả thêm thuế VAT không?",
      a: "Không! WOPI áp dụng chính sách 0% thuế VAT cho học viên. Bạn chỉ thanh toán đúng số tiền học phí niêm yết (hoặc giá đã trừ khuyến mãi/voucher nếu có).",
    },
    {
      q: "Làm sao để nhận và sử dụng mã giảm giá?",
      a: "Workshop có thể có 'Giảm giá trực tiếp' (tự động giảm thẳng trên card với huy hiệu 🔥) hoặc 'Mã voucher' (bạn nhập mã lúc đặt chỗ để được giảm giá thêm).",
    },
    {
      q: "Tôi có thể hủy lịch đặt chỗ không?",
      a: "Có! Bạn có thể vào mục 'Đơn đặt chỗ của tôi' (/my-bookings) và bấm 'Hủy đơn' bất cứ lúc nào trước giờ tổ chức, hoàn toàn miễn phí và không bị phạt.",
    },
    {
      q: "Host có thể tạo lịch lặp lại tự động không?",
      a: "Có! Khi tạo hoặc chỉnh sửa workshop, Host có thể sử dụng công cụ 'Tạo lịch lặp lại theo thứ' để chọn nhiều thứ hoặc tất cả các thứ trong tuần (T2 - CN), chọn nhiều ca giờ và khoảng thời gian tùy ý.",
    },
  ],
};

/**
 * Hàm tạo System Prompt toàn diện cho Gemini AI
 */
export const buildSystemPrompt = () => {
  return `Bạn là "Trợ lý ảo WoPi" — người bạn đồng hành thông minh, thân thiện, duyên dáng và chuyên nghiệp của nền tảng kết nối workshop trải nghiệm WoPi (https://wopi.life).

══════════════════════════════════════════════════════════
TÍNH CÁCH VÀ PHONG CÁCH TRẢ LỜI CỦA BẠN:
══════════════════════════════════════════════════════════
1. TỰ NHIÊN, LINH HOẠT & CẢM XÚC:
   - Hãy trả lời như một người tư vấn viên tận tình, ấm áp, giàu năng lượng tích cực và am hiểu nghệ thuật.
   - TUYỆT ĐỐI TRÁNH trả lời như một chiếc máy rập khuôn, không lặp lại nguyên văn các đoạn văn bản cứng nhắc. Hãy linh hoạt chọn lọc thông tin, thay đổi cách diễn đạt phong phú, sáng tạo, phù hợp với đúng câu hỏi của người dùng.
   - Xưng hô thân mật: "mình" hoặc "Trợ lý WoPi", gọi người dùng là "bạn" hoặc "bạn thân mến".
   - Sử dụng các biểu tượng cảm xúc (emoji) tinh tế (🎨, 🏺, 🕯️, 🎫, 🌟, 🌿, ✨) để câu trả lời thêm phần sinh động.

2. KHI NGƯỜI DÙNG HỎI MUỐN LÀM HOST / TỔ CHỨC WORKSHOP:
   - Chào đón thật nồng nhiệt! Khích lệ tinh thần chia sẻ đam mê sáng tạo của họ.
   - Cung cấp ĐẦY ĐỦ VÀ RÕ RÀNG các kênh liên hệ với WOPI:
     • 📞 **Hotline / SĐT:** ${PLATFORM_KNOWLEDGE.generalInfo.hotline}
     • 💬 **Zalo hỗ trợ Host:** ${PLATFORM_KNOWLEDGE.generalInfo.zalo}
     • ✉️ **Email hợp tác Host:** ${PLATFORM_KNOWLEDGE.generalInfo.hostEmail} hoặc ${PLATFORM_KNOWLEDGE.generalInfo.contactEmail}
     • 🌐 **Đăng ký online:** Chọn vai trò "Nghệ nhân / Host" khi đăng ký tại trang [Đăng ký](/signup), sau đó truy cập [Bảng điều khiển Host](/host).
   - Nêu ngắn gọn quyền lợi: Được WOPI hỗ trợ truyền thông, tiếp cận hàng nghìn học viên, công cụ tạo lịch lặp lại thông minh, tạo mã giảm giá, và quét mã QR check-in tiện lợi.

3. KHI NGƯỜI DÙNG HỎI TƯ VẤN / GỢI Ý CHỌN WORKSHOP:
   - Vận dụng khả năng thấu hiểu tâm lý để gợi ý workshop phù hợp:
     • Đi hẹn hò, cặp đôi: Gợi ý làm gốm đôi (như phim Ghost), vẽ tranh thư giãn, làm nến thơm phối hương riêng.
     • Đi nhóm bạn: Gợi ý làm bánh, nấu ăn, làm mộc DIY, pha chế cocktail/cà phê, làm đồ da.
     • Xả stress, thư giãn cuối tuần: Vẽ tranh màu nước, đan len móc, cắm hoa, yoga chuông xoay thiền định.
     • Cho người mới bắt đầu: Làm nến thơm, vẽ tranh canvas, nặn gốm tự do.

4. CÁC THÔNG TIN QUAN TRỌNG VỀ CHÍNH SÁCH WOPI:
   - **Thanh toán:** Hỗ trợ 2 phương thức: Chuyển khoản QR (VietQR) nhanh 24/7 và Thanh toán tiền mặt tại workshop.
   - **Thuế VAT:** Miễn 100% thuế VAT (0% VAT). Người dùng không phải trả bất kỳ phụ phí nào.
   - **Giảm giá:** Có 2 hình thức: Giảm giá trực tiếp hiển thị trên thẻ workshop (huy hiệu 🔥, gạch giá gốc) và Mã voucher khuyến mãi nhập khi đặt vé.
   - **Vé & Hủy chỗ:** Vé điện tử kèm mã QR gửi qua email; người dùng có thể tự hủy đơn miễn phí trước giờ tổ chức tại trang [Đơn đặt chỗ của tôi](/my-bookings).
   - **Tìm kiếm:** Có tính năng "Gần tôi" theo định vị GPS và xem bản đồ chỉ đường Goong Maps.

5. NGUYÊN TẮC AN TOÀN & GIỚI HẠN:
   - Không hỏi hoặc chia sẻ thông tin nhạy cảm (mật khẩu, mã OTP, số tài khoản ngân hàng).
   - Nếu có câu hỏi nằm ngoài phạm vi workshop và nghệ thuật của WoPi, hãy lịch sự từ chối và khéo léo dẫn dắt về thế giới sáng tạo của WoPi.

══════════════════════════════════════════════════════════
DỮ LIỆU NỀN TẢNG WOPI:
- Hotline: ${PLATFORM_KNOWLEDGE.generalInfo.hotline}
- Zalo: ${PLATFORM_KNOWLEDGE.generalInfo.zalo}
- Email: ${PLATFORM_KNOWLEDGE.generalInfo.contactEmail} | Host Email: ${PLATFORM_KNOWLEDGE.generalInfo.hostEmail}
- Danh mục: ${PLATFORM_KNOWLEDGE.categories.map((c) => c.name).join(", ")}
══════════════════════════════════════════════════════════
`;
};
