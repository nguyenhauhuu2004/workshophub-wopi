import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Headphones,
  Mail,
  MapPin,
  PhoneCall,
} from "lucide-react";


export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden border-t border-orange-200/60 bg-gradient-to-b from-amber-50/60 via-orange-50/40 to-white text-foreground dark:border-slate-800/80 dark:from-[#0d1624] dark:via-[#09111c] dark:to-[#050b13]">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Warm sunrise top-left glow */}
        <div
          className="absolute -left-20 -top-24 size-96 rounded-full opacity-60 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 154, 68, 0.35) 0%, rgba(255, 107, 0, 0.1) 50%, transparent 75%)",
            filter: "blur(60px)",
          }}
        />
        {/* Soft cyan/sky accent glow on bottom-right */}
        <div
          className="absolute -right-20 top-1/3 size-96 rounded-full opacity-50 dark:opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)",
            filter: "blur(70px)",
          }}
        />
        {/* Delicate decorative craft grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        {/* Directory Grid (Clean, Focused, Restrained) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 pb-10 border-b border-orange-200/50 dark:border-slate-800">
          {/* Brand & Mission (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link
              to="/"
              className="h-24 inline-flex items-center gap-2 group outline-none"
            >
              <img
                src="/logo.png"
                alt="WoPi Logo"
                className=" w-42 object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <span className="hidden text-2xl font-black tracking-tight text-foreground">
                Wo<span className="text-[#FF6B00]">Pi</span>
              </span>
            </Link>

            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
              WoPi là nền tảng kết nối những tâm hồn yêu nghệ thuật thủ công, tự
              tay trải nghiệm và tạo tác nên những sản phẩm độc bản cùng các
              nghệ nhân tài hoa khắp Việt Nam.
            </p>

            {/* Quick Live Status & Presence info */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                48 Studio đang mở đặt chỗ
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-800 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-300">
                <MapPin className="size-3 text-[#FF6B00]" /> Hà Nội • Đà Nẵng •
                TP.HCM
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-3.5 text-[#FF6B00]" />
                <span>
                  Hotline:{" "}
                  <strong className="text-foreground">1900 8888</strong> (08:00
                  - 21:00)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-[#FF6B00]" />
                <a
                  href="mailto:support@wopi.vn"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  support@wopi.vn
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Khám phá theo chủ đề (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground">
              Khám phá chủ đề
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {[
                { name: "Làm gốm & Men màu Bát Tràng", cat: "Pottery" },
                { name: "Vẽ tranh Canvas & Acrylic", cat: "Art" },
                { name: "Nến thơm Botanical & Tinh dầu", cat: "DIY" },
                { name: "Chế tác Đồ da & Khắc gỗ", cat: "Woodwork" },
                { name: "Đan len, Thêu tay & Macrame", cat: "Handmade" },
                { name: "Làm bánh & Pha chế Barista", cat: "Baking" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={`/workshops?category=${encodeURIComponent(item.cat)}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#FF6B00] hover:translate-x-1 duration-150"
                  >
                    <span className="text-[10px] text-orange-400">✦</span>{" "}
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Dành cho Học viên & Host (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground">
              Dành cho bạn
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link
                  to="/workshops"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Tất cả Workshop
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Lịch & Vé đã đặt
                </Link>
              </li>
              <li>
                <Link
                  to="/workshops/create"
                  className="hover:text-[#FF6B00] transition-colors font-medium text-orange-600 dark:text-orange-400"
                >
                  Mở Workshop (Host)
                </Link>
              </li>
              <li>
                <Link
                  to="/host"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Bảng điều khiển Studio
                </Link>
              </li>
              <li>
                <Link
                  to="/chatapp"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Trò chuyện với Nghệ nhân
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ trợ & Cam kết (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-foreground">
              Hỗ trợ & Cam kết
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link
                  to="/workshops"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Quy định đổi/hoàn vé
                </Link>
              </li>
              <li>
                <Link
                  to="/workshops"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Tiêu chuẩn nghệ nhân
                </Link>
              </li>
              <li>
                <Link
                  to="/workshops"
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@wopi.vn"
                  className="inline-flex items-center gap-1 hover:text-[#FF6B00] transition-colors"
                >
                  <Headphones className="size-3.5 text-orange-500" />
                  <span>Trung tâm trợ giúp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Policies & Back to Top */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
            <p>
              © {new Date().getFullYear()} WoPi Platform. Nền tảng workshop thủ
              công hàng đầu.
            </p>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <Link
              to="/workshops"
              className="hover:text-foreground transition-colors"
            >
              Điều khoản dịch vụ
            </Link>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <Link
              to="/workshops"
              className="hover:text-foreground transition-colors"
            >
              Chính sách quyền riêng tư
            </Link>
          </div>

          {/* Back to top smooth button */}
          <motion.button
            type="button"
            onClick={scrollToTop}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-sm transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp className="size-3.5 text-[#FF6B00]" /> Lên đầu trang
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
