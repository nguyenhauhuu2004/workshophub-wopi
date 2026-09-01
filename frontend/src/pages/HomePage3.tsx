import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  type Variants,
} from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Palette,
  Search,
  Sparkles,
  TicketCheck,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import WorkshopCard from "@/components/WorkshopCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { workshopService } from "@/services/workshopService";
import { CATEGORIES } from "@/data";
import type { Workshop, WorkshopSchedule } from "@/types/workshop";

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const categoryIcons = ["🏺", "🎨", "🧶", "🕯️", "👜", "🖌️", "🪵", "🧵"];
const cardRotations = [-2, 1.5, -1, 2.5, -1.5, 2, -2.5, 1];

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim();

const getScheduleTimestamp = (s: WorkshopSchedule) => {
  const ts = new Date(s.startAt).getTime();
  return Number.isNaN(ts) ? null : ts;
};

const getNextSchedule = (w: Workshop) => {
  const now = Date.now();
  return [...(w.schedules ?? [])]
    .filter((s) => { const ts = getScheduleTimestamp(s); return ts !== null && ts >= now; })
    .sort((a, b) => (getScheduleTimestamp(a) ?? Infinity) - (getScheduleTimestamp(b) ?? Infinity))[0];
};

const getScheduleDate = (w: Workshop) => getNextSchedule(w)?.startAt;

const formatScheduleDate = (dateValue?: string) => {
  if (!dateValue) return { day: "—", month: "—" };
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "—" };
  return {
    day: date.toLocaleDateString("vi-VN", { day: "2-digit" }),
    month: `Th${date.getMonth() + 1}`,
  };
};

const formatScheduleTime = (w: Workshop) => {
  const s = getNextSchedule(w);
  if (!s) return w.duration || "Đang cập nhật";
  const d = new Date(s.startAt);
  if (Number.isNaN(d.getTime())) return w.duration || "Đang cập nhật";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

/* ═══════════════════════════════════════════════════
   ANIMATION PRESETS
   ═══════════════════════════════════════════════════ */

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 30 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ═══════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, inView: boolean) {
  const motionVal = useMotionValue(0);
  const rounded = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView && target > 0) {
      const controls = animate(motionVal, target, {
        duration: 1.8,
        ease: [0.22, 1, 0.36, 1],
      });
      return controls.stop;
    }
  }, [inView, target, motionVal]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(Math.round(v).toString()));
    return unsub;
  }, [rounded]);

  return display;
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function HomePage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [totalWorkshops, setTotalWorkshops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const kw = normalizeText(searchQuery);
    return [...new Set(workshops.map((w) => w.title?.trim()).filter((t): t is string => Boolean(t)))]
      .filter((t) => normalizeText(t).includes(kw)).slice(0, 6);
  }, [workshops, searchQuery]);

  useEffect(() => {
    let m = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await workshopService.getWorkshops({ page: 1, limit: 12 });
        if (!m) return;
        setWorkshops(data.workshops ?? []);
        setTotalWorkshops(data.total ?? data.workshops?.length ?? 0);
      } catch (e) {
        console.error(e);
        if (m) { setWorkshops([]); setTotalWorkshops(0); toast.error("Không thể tải dữ liệu"); }
      } finally { if (m) setLoading(false); }
    };
    void load();
    return () => { m = false; };
  }, []);

  const featured = useMemo(() => workshops, [workshops]);
  const latest = useMemo(() => workshops.slice(4, 9), [workshops]);
  const upcoming = useMemo(
    () => [...workshops]
      .filter((w) => getScheduleDate(w))
      .sort((a, b) => new Date(getScheduleDate(a) ?? 0).getTime() - new Date(getScheduleDate(b) ?? 0).getTime())
      .slice(0, 4),
    [workshops],
  );

  const stats = useMemo(() => ({
    total: totalWorkshops,
    cats: new Set(workshops.flatMap((w) => w.categories ?? [])).size,
    upcoming: upcoming.length,
    spots: workshops.reduce((t, w) => t + (getNextSchedule(w)?.spotsLeft ?? 0), 0),
  }), [totalWorkshops, upcoming, workshops]);

  const heroImage = featured[0]?.thumbnail?.url ?? "/placeholderWorkshop.jpg";

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (searchQuery.trim()) p.set("search", searchQuery.trim());
    if (searchAddress.trim()) p.set("address", searchAddress.trim());
    navigate(p.toString() ? `/workshops?${p}` : "/workshops");
  };

  const handleCategory = (c: string) => navigate(`/workshops?category=${encodeURIComponent(c)}`);

  // Parallax removed

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FDF8F0] dark:bg-background text-[#1A1A1F] dark:text-foreground overflow-x-hidden font-sans">
      <div>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO — Bright, Clean
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative overflow-hidden bg-[#FDF8F0] dark:bg-background min-h-[100dvh]">
          {/* ── Static soft organic blobs ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -left-32 top-1/4 size-[600px] rounded-full opacity-40 mix-blend-multiply dark:mix-blend-screen dark:opacity-20"
              style={{
                background: "radial-gradient(circle, #FF6B00 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
            <div
              className="absolute -right-20 top-1/3 size-[500px] rounded-full opacity-30 mix-blend-multiply dark:mix-blend-screen dark:opacity-20"
              style={{
                background: "radial-gradient(circle, #7C956B 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
            <div
              className="absolute bottom-0 left-1/3 size-[400px] rounded-full opacity-30 mix-blend-multiply dark:mix-blend-screen dark:opacity-20"
              style={{
                background: "radial-gradient(circle, #C05621 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          {/* ── Grid pattern overlay (subtle) ── */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(26,26,31,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(26,26,31,0.5) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* ── Hero image ── */}
          <div className="absolute right-0 top-0 h-full w-[50%] max-lg:hidden">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#FDF8F0] via-[#FDF8F0]/80 to-transparent dark:from-background dark:via-background/80" />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#FDF8F0] via-transparent to-[#FDF8F0]/30 dark:from-background dark:to-background/30" />
            <img src={heroImage} alt="" className="h-full w-full object-cover rounded-bl-[80px]" />
          </div>

          {/* ── Content ── */}
          <div className="relative z-20 mx-auto flex min-h-[100dvh] max-w-[1440px] items-center px-6 py-32 sm:px-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-2xl"
            >
              {/* Live badge */}
              <motion.div variants={fadeSlideUp} className="mb-8">
                <span className="inline-flex items-center gap-3 rounded-full border border-[#FF6B00]/20 bg-white/60 dark:bg-white/[0.04] px-5 py-2.5 backdrop-blur-xl shadow-sm">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-[#FF6B00]" />
                  </span>
                  <span className="text-sm font-medium text-[#1A1A1F] dark:text-white/70">
                    {stats.total > 0 ? `${stats.total}+ workshop đang mở đăng ký` : "Nền tảng workshop thủ công #1 Việt Nam"}
                  </span>
                </span>
              </motion.div>

              {/* Headline — font-heading */}
              <motion.h1 variants={fadeSlideUp} className="text-[#1A1A1F] dark:text-white font-heading">
                <span className="block text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.95] tracking-[-0.03em]">
                  Chạm tay.
                </span>
                <span className="mt-2 block text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.95] tracking-[-0.03em]">
                  Tạo nên.
                </span>
                <span
                  className="mt-2 block text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.95] tracking-[-0.03em]"
                  style={{
                    background: "linear-gradient(135deg, #FF6B00 0%, #C05621 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Mang về.
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeSlideUp}
                className="mt-8 max-w-lg text-lg leading-relaxed text-[#1A1A1F]/70 dark:text-white/50"
              >
                Hàng trăm workshop thủ công — làm gốm, vẽ tranh, nến thơm,
                đan móc — được tổ chức bởi những nghệ nhân đam mê nhất.
              </motion.p>

              {/* Search */}
              <motion.form
                variants={fadeSlideUp}
                onSubmit={handleSearch}
                className="mt-10 flex flex-col gap-0 overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white/90 dark:border-white/[0.08] dark:bg-white/[0.04] backdrop-blur-2xl shadow-lg shadow-[#1A1A1F]/5 sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-[#1A1A1F]/40 dark:text-white/30" />
                  <Input
                    value={searchQuery}
                    autoComplete="off"
                    placeholder="Bạn muốn trải nghiệm gì?"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    className="h-14 border-0 bg-transparent pl-14 text-[#1A1A1F] dark:text-white placeholder:text-[#1A1A1F]/40 dark:placeholder:text-white/25 shadow-none focus-visible:ring-0"
                  />
                  {showSuggestions && searchQuery.trim() && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl">
                      {suggestions.map((t) => (
                        <button key={t} type="button" onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSearchQuery(t); setShowSuggestions(false); }}
                          className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-muted"
                        >{t}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative min-w-0 flex-1 border-t border-[#E8E2D8] dark:border-white/[0.06] sm:border-l sm:border-t-0">
                  <MapPin className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#1A1A1F]/40 dark:text-white/30" />
                  <Input
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Khu vực"
                    className="h-14 border-0 bg-transparent pl-14 text-[#1A1A1F] dark:text-white placeholder:text-[#1A1A1F]/40 dark:placeholder:text-white/25 shadow-none focus-visible:ring-0"
                  />
                </div>

                <Button type="submit" className="h-14 rounded-none bg-[#FF6B00] px-8 text-base font-bold text-white hover:bg-[#E66000] sm:rounded-none sm:rounded-r-2xl">
                  Tìm kiếm
                </Button>
              </motion.form>

              {/* Trending tags */}
              <motion.div variants={fadeSlideUp} className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#1A1A1F]/50 dark:text-white/30">Phổ biến:</span>
                {["Làm gốm", "Vẽ tranh", "Nến thơm", "Đan móc", "Làm da"].map((tag) => (
                  <button
                    key={tag} type="button"
                    onClick={() => handleCategory(tag)}
                    className="rounded-full border border-[#E8E2D8] bg-white/60 dark:border-white/[0.06] dark:bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-[#1A1A1F]/70 dark:text-white/50 transition-all hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* ── Scroll indicator ── */}
          <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#1A1A1F]/40 dark:text-white/25">Scroll</span>
              <div className="h-10 w-[1px] bg-gradient-to-b from-[#1A1A1F]/30 dark:from-white/30 to-transparent" />
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STATS — Animated counters
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <AnimatedStatsBar stats={stats} />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CATEGORY MARQUEE
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="border-b border-[#E8E2D8] dark:border-border bg-white dark:bg-card overflow-hidden py-6">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex w-max gap-4"
          >
            {[...CATEGORIES.slice(0, 8), ...CATEGORIES.slice(0, 8)].map((cat, i) => (
              <button
                key={`${cat.name}-${i}`}
                type="button"
                onClick={() => handleCategory(cat.name)}
                className="group flex items-center gap-3 rounded-2xl border border-[#FDF8F0] dark:border-transparent bg-[#FDF8F0]/50 dark:bg-transparent px-5 py-3 text-sm font-semibold text-[#1A1A1F] dark:text-foreground transition-all hover:border-[#FF6B00]/20 hover:bg-[#FF6B00]/5 hover:shadow-sm hover:shadow-[#FF6B00]/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-secondary text-xl transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-sm">
                  {categoryIcons[i % categoryIcons.length]}
                </span>
                {cat.name}
              </button>
            ))}
          </motion.div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FEATURED WORKSHOPS — Craft Table Carousel
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <RevealSection className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeader
              eyebrow="Đáng thử nhất"
              title="Workshop nổi bật"
              description="Những trải nghiệm được yêu thích nhất trên nền tảng."
              onAction={() => navigate("/workshops")}
            />
            <div className="mt-12">
              {loading ? <LoadingBlock /> : featured.length > 0 ? (
                <Carousel
                  plugins={[Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true })]}
                  opts={{ align: "start", loop: featured.length > 4 }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-5">
                    {featured.map((w, index) => {
                      const rotation = cardRotations[index % cardRotations.length];
                      return (
                        <CarouselItem key={w._id} className="basis-full pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 pb-8">
                          <motion.div
                            whileHover={{
                              rotate: 0,
                              y: -8,
                              scale: 1.03,
                              transition: { type: "spring", stiffness: 300, damping: 20 }
                            }}
                            initial={{ rotate: rotation }}
                            className="h-full rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white p-2"
                            style={{ originY: 0.5, originX: 0.5 }}
                          >
                            <WorkshopCard workshop={w} />
                          </motion.div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="hidden lg:flex" />
                  <CarouselNext className="hidden lg:flex" />
                </Carousel>
              ) : <EmptyState message="Chưa có workshop nổi bật." />}
            </div>
          </div>
        </RevealSection>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BENTO GRID — Experience collections
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <RevealSection className="bg-[#E8E2D8]/40 dark:bg-secondary/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <SectionHeader
              eyebrow="Gợi ý theo tâm trạng"
              title="Hôm nay bạn muốn thế nào?"
              description="Chọn nhịp trải nghiệm phù hợp — WoPi đưa bạn đến workshop đáng thử."
              onAction={() => navigate("/workshops")}
            />

            {/* Bento layout */}
            <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:grid-rows-2">
              {/* Large card */}
              <BentoCard
                className="lg:col-span-2 lg:row-span-2"
                onClick={() => CATEGORIES[0] ? handleCategory(CATEGORIES[0].name) : navigate("/workshops")}
                gradient="from-[#FF6B00] to-[#C05621]"
              >
                <div className="relative z-10 flex h-full min-h-[340px] flex-col justify-end p-8 sm:p-10">
                  <div
                    className="absolute right-8 top-8 size-20 text-white/15"
                    style={{ animation: "spin 30s linear infinite" }}
                  >
                    <Palette className="size-full" />
                  </div>
                  <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm border border-white/20">
                    <Sparkles className="size-3.5" /> Chậm lại một chút
                  </span>
                  <h3 className="max-w-md text-3xl font-heading font-black leading-tight tracking-tight text-white sm:text-4xl">
                    Tự tay tạo nên một tác phẩm thật riêng
                  </h3>
                  <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
                    Workshop thủ công nhẹ nhàng — nơi bạn quên đi màn hình và tập trung vào niềm vui sáng tạo.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white bg-white/10 w-fit px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors">
                    Khám phá ngay <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </BentoCard>

              {/* Small cards */}
              <motion.div 
                initial={{ rotate: 1 }} 
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="h-full"
              >
                <BentoCard
                  onClick={() => CATEGORIES[1] ? handleCategory(CATEGORIES[1].name) : navigate("/workshops")}
                  gradient="from-[#7C956B] to-[#5a6c4d]"
                  className="h-full"
                >
                  <div className="relative z-10 flex h-full min-h-[160px] flex-col justify-end p-7">
                    <span className="mb-3 text-xs font-bold uppercase tracking-widest text-white/70">
                      Hẹn nhau cuối tuần
                    </span>
                    <h3 className="max-w-sm text-xl font-heading font-black leading-tight text-white">
                      Thêm một câu chuyện vào cuối tuần của bạn
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white/90">
                      Xem workshop <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </BentoCard>
              </motion.div>

              <motion.div 
                initial={{ rotate: -1 }} 
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="h-full"
              >
                <BentoCard
                  onClick={() => CATEGORIES[2] ? handleCategory(CATEGORIES[2].name) : navigate("/workshops")}
                  gradient="from-[#D49A89] to-[#b37c6d]"
                  className="h-full"
                >
                  <div className="relative z-10 flex h-full min-h-[160px] flex-col justify-end p-7">
                    <span className="mb-3 text-xs font-bold uppercase tracking-widest text-white/70">
                      Khám phá kỹ năng mới
                    </span>
                    <h3 className="max-w-sm text-xl font-heading font-black leading-tight text-white">
                      Bắt đầu từ tò mò, mang về thành quả
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white/90">
                      Thử ngay <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </BentoCard>
              </motion.div>
            </div>
          </div>
        </RevealSection>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LATEST + SIDEBAR
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <RevealSection className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <SectionHeader
                eyebrow="Mới đăng"
                title="Workshop mới nhất"
                onAction={() => navigate("/workshops")}
              />
              <div className="mt-8">
                {loading ? <LoadingBlock /> : latest.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {latest.map((w) => (
                      <div key={w._id} className="bg-white dark:bg-card rounded-2xl p-2 shadow-sm border border-[#E8E2D8] dark:border-border">
                        <WorkshopCard workshop={w} />
                      </div>
                    ))}
                    <button type="button" onClick={() => navigate("/workshops")}
                      className="group flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E2D8] dark:border-border bg-[#FDF8F0]/50 dark:bg-card transition-all hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 hover:shadow-lg hover:shadow-[#FF6B00]/10"
                    >
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-white dark:bg-[#FF6B00]/10 transition-transform group-hover:scale-110 shadow-sm">
                        <ArrowRight className="size-6 text-[#FF6B00]" />
                      </span>
                      <span className="mt-4 font-bold text-[#1A1A1F]/60 dark:text-muted-foreground group-hover:text-[#FF6B00]">Xem thêm</span>
                    </button>
                  </div>
                ) : <EmptyState message="Chưa có workshop nào." />}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="h-fit overflow-hidden rounded-2xl border border-[#E8E2D8] dark:border-border bg-white dark:bg-card shadow-lg shadow-[#1A1A1F]/5 xl:sticky xl:top-24">
              <div className="bg-[#FDF8F0] dark:bg-gradient-to-r dark:from-[#FF6B00] dark:to-[#FF9A44] px-6 py-5 border-b border-[#E8E2D8] dark:border-none">
                <h2 className="text-lg font-heading font-black text-[#1A1A1F] dark:text-white flex items-center gap-2">
                  <span className="text-[#FF6B00]">🔥</span> Sắp diễn ra
                </h2>
              </div>
              <div className="p-5">
                {loading ? <LoadingBlock className="min-h-48" /> : upcoming.length > 0 ? (
                  <div className="divide-y divide-[#E8E2D8] dark:divide-border">
                    {upcoming.map((w) => {
                      const sd = formatScheduleDate(getScheduleDate(w));
                      return (
                        <button key={w._id} type="button"
                          onClick={() => navigate(`/workshops/${w._id}`)}
                          className="group grid w-full grid-cols-[52px_1fr_52px] gap-3 py-4 text-left"
                        >
                          <div className="flex flex-col items-center justify-center rounded-xl bg-[#FDF8F0] dark:bg-[#FF6B00]/10 border border-[#E8E2D8] dark:border-none px-2 py-2">
                            <span className="text-lg font-black text-[#FF6B00]">{sd.day}</span>
                            <span className="text-[9px] font-bold text-[#1A1A1F]/50 dark:text-muted-foreground uppercase">{sd.month}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="line-clamp-1 text-sm font-bold text-[#1A1A1F] dark:text-foreground transition-colors group-hover:text-[#FF6B00]">{w.title}</h3>
                            <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#1A1A1F]/50 dark:text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />{w.location?.address}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#1A1A1F]/50 dark:text-muted-foreground">
                              <Clock3 className="size-3 shrink-0" />{formatScheduleTime(w)}
                            </p>
                          </div>
                          <img src={w.thumbnail?.url ?? "/placeholderWorkshop.jpg"} alt={w.title}
                            className="size-[52px] rounded-xl object-cover transition-transform group-hover:scale-105 shadow-sm" />
                        </button>
                      );
                    })}
                  </div>
                ) : <p className="py-8 text-center text-sm text-[#1A1A1F]/50 dark:text-muted-foreground">Chưa có lịch workshop.</p>}
                <Button type="button" variant="outline" onClick={() => navigate("/workshops")} className="mt-4 w-full rounded-xl border-[#E8E2D8] text-[#1A1A1F] hover:bg-[#FDF8F0] hover:text-[#FF6B00] dark:border-input dark:text-foreground dark:hover:bg-accent">
                  Xem tất cả
                </Button>
              </div>
            </aside>
          </div>
        </RevealSection>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HOW IT WORKS — Visual timeline
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <RevealSection className="bg-white dark:bg-[#060d1b] px-4 py-24 sm:px-6 lg:px-8 border-y border-[#E8E2D8] dark:border-transparent">
          <div className="mx-auto max-w-[1440px]">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Dễ như đếm 1-2-3</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-heading font-black tracking-tight sm:text-5xl text-[#1A1A1F] dark:text-white">
                Từ cảm hứng đến chỗ ngồi,{" "}
                <span style={{
                  background: "linear-gradient(135deg, #FF6B00, #C05621)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>chỉ vài phút</span>
              </h2>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {[
                { icon: <Search className="size-7" />, title: "Tìm trải nghiệm", desc: "Lọc theo từ khóa, chủ đề hoặc khu vực. Mọi thông tin hiện rõ trước khi bạn quyết định.", color: "#7C956B" },
                { icon: <CalendarDays className="size-7" />, title: "Chọn lịch phù hợp", desc: "Kiểm tra thời gian, số chỗ và giá. Chọn buổi phù hợp nhất với kế hoạch của bạn.", color: "#FF6B00" },
                { icon: <TicketCheck className="size-7" />, title: "Xác nhận & tận hưởng", desc: "Đặt chỗ nhanh chóng, nhận mã check-in và chuẩn bị cho một trải nghiệm đáng nhớ.", color: "#C05621" },
              ].map((step, idx) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-3xl border border-[#E8E2D8] dark:border-white/[0.06] bg-[#FDF8F0]/50 dark:bg-white/[0.03] p-8 transition-all hover:border-[#FF6B00]/30 hover:bg-white hover:shadow-xl hover:shadow-[#1A1A1F]/5 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05]"
                >
                  <div className="relative z-10">
                    <div
                      className="mb-6 flex size-14 items-center justify-center rounded-2xl shadow-sm"
                      style={{ backgroundColor: `${step.color}15`, color: step.color }}
                    >
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-heading font-black text-[#1A1A1F] dark:text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1A1A1F]/70 dark:text-white/45">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HOST CTA — Warm inviting
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <RevealSection className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FDF8F0] to-[#f5ebd9] dark:from-[#060d1b] dark:to-[#060d1b] border border-[#E8E2D8] dark:border-none shadow-xl shadow-[#1A1A1F]/5 dark:shadow-none">
              {/* Orb */}
              <div className="absolute -right-40 -top-40 size-[500px] rounded-full opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
                style={{ background: "radial-gradient(circle, #FF6B00 0%, transparent 70%)", filter: "blur(60px)" }} />
              <div className="absolute -bottom-32 -left-32 size-[400px] rounded-full opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
                style={{ background: "radial-gradient(circle, #7C956B 0%, transparent 70%)", filter: "blur(60px)" }} />

              <div className="relative z-10 grid gap-8 p-8 sm:p-14 lg:grid-cols-[1.3fr_0.7fr] lg:p-20">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/20 bg-white/60 dark:bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FF6B00] dark:text-white/50 backdrop-blur-sm shadow-sm">
                    <Zap className="size-3.5" /> Dành cho host & nghệ nhân
                  </span>
                  <h2 className="mt-8 max-w-xl text-3xl font-heading font-black leading-tight tracking-tight text-[#1A1A1F] dark:text-white sm:text-4xl lg:text-5xl">
                    Biến đam mê thành{" "}
                    <span style={{
                      background: "linear-gradient(135deg, #FF6B00, #C05621)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>workshop của riêng bạn</span>
                  </h2>
                  <p className="mt-6 max-w-lg text-base leading-relaxed text-[#1A1A1F]/70 dark:text-white/45">
                    Tạo trang workshop chuyên nghiệp, quản lý lịch & booking,
                    check-in bằng mã — tất cả trên một hệ thống duy nhất.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button onClick={() => navigate("/workshops/create")}
                      className="rounded-full bg-[#FF6B00] px-8 py-3 text-base font-bold text-white hover:bg-[#E66000] shadow-md shadow-[#FF6B00]/20">
                      Tạo workshop <ArrowRight className="ml-2 size-4" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/host")}
                      className="rounded-full border-[#1A1A1F]/10 bg-white px-8 py-3 text-base text-[#1A1A1F] hover:bg-[#FDF8F0] dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/5">
                      Tìm hiểu thêm
                    </Button>
                  </div>
                </div>

                <div className="grid content-center gap-4">
                  {[
                    { icon: <BookOpen className="size-5" />, title: "Trang giới thiệu pro", desc: "Nội dung, lịch và bản đồ." },
                    { icon: <Users className="size-5" />, title: "Quản lý người tham dự", desc: "Booking & số chỗ realtime." },
                    { icon: <BadgeCheck className="size-5" />, title: "Check-in dễ dàng", desc: "Xác nhận bằng mã QR." },
                  ].map((b) => (
                    <div key={b.title} className="flex items-start gap-4 rounded-2xl border border-[#E8E2D8] dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.03] p-5 backdrop-blur-sm shadow-sm">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FDF8F0] dark:bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/10 dark:border-none">{b.icon}</span>
                      <div>
                        <h3 className="font-bold text-[#1A1A1F] dark:text-white">{b.title}</h3>
                        <p className="mt-1 text-sm text-[#1A1A1F]/60 dark:text-white/40">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BOTTOM FEATURES
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
            {[
              { icon: <Users className="size-6" />, title: "Cộng đồng sáng tạo", desc: "Kết nối với người cùng đam mê." },
              { icon: <CalendarDays className="size-6" />, title: "Lịch linh hoạt", desc: "Chọn thời gian phù hợp nhất." },
              { icon: <Sparkles className="size-6" />, title: "Trải nghiệm đáng nhớ", desc: "Tự tay tạo sản phẩm riêng." },
            ].map((f) => (
              <div key={f.title}
                className="flex items-center gap-5 rounded-2xl border border-[#E8E2D8] dark:border-border bg-white dark:bg-card p-6 transition-all hover:border-[#FF6B00]/30 hover:shadow-xl hover:shadow-[#FF6B00]/5"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#FDF8F0] dark:bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/10 dark:border-none shadow-inner">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-[#1A1A1F] dark:text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-[#1A1A1F]/60 dark:text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

function AnimatedStatsBar({ stats }: { stats: { total: number; cats: number; upcoming: number; spots: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const total = useAnimatedCounter(stats.total, inView);
  const cats = useAnimatedCounter(stats.cats, inView);
  const upcoming = useAnimatedCounter(stats.upcoming, inView);
  const spots = useAnimatedCounter(stats.spots, inView);

  const items = [
    { value: total, suffix: "+", label: "Workshop đang mở" },
    { value: cats, suffix: "", label: "Chủ đề sáng tạo" },
    { value: upcoming, suffix: "", label: "Lịch sắp tới" },
    { value: spots, suffix: "", label: "Chỗ đang nhận" },
  ];

  return (
    <div ref={ref} className="border-y border-[#E8E2D8] dark:border-border bg-white dark:bg-card">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-[#E8E2D8] dark:divide-border md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="text-3xl font-heading font-black tracking-tight text-[#1A1A1F] dark:text-foreground sm:text-4xl">
              {item.value}<span className="text-[#FF6B00]">{item.suffix}</span>
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1F]/50 dark:text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoCard({
  children,
  className = "",
  onClick,
  gradient,
}: {
  children: ReactNode;
  className?: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] bg-gradient-to-br ${gradient} text-left shadow-lg transition-all hover:shadow-xl w-full h-full ${className}`}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
      {children}
    </button>
  );
}

function RevealSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={scaleReveal}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-[#1A1A1F] dark:text-foreground sm:text-3xl">{title}</h2>
        {description && <p className="mt-3 text-sm leading-relaxed text-[#1A1A1F]/60 dark:text-muted-foreground">{description}</p>}
      </div>
      <button type="button" onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-white dark:bg-accent px-4 py-2 border border-[#E8E2D8] dark:border-border shadow-sm text-sm font-bold text-[#1A1A1F] dark:text-foreground transition hover:border-[#FF6B00] hover:text-[#FF6B00] sm:self-auto">
        Xem tất cả <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function LoadingBlock({ className = "min-h-56" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="size-8 animate-spin text-[#FF6B00]" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#E8E2D8] dark:border-border bg-white dark:bg-card p-10 text-center text-sm font-medium text-[#1A1A1F]/50 dark:text-muted-foreground">
      {message}
    </div>
  );
}
