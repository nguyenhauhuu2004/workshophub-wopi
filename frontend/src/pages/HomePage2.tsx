import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Gift,
  Grid2X2,
  Heart,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TicketCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import Header, { type NavigationSection } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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

const normalizeText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
};

const navigationData: NavigationSection[] = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Workshop",
    href: "/workshops",
  },
  {
    title: "Studio & Nghệ nhân",
    href: "/host",
  },
  {
    title: "Tạo workshop",
    href: "/workshops/create",
  },
  {
    title: "My bookings",
    href: "/my-bookings",
  },
];

const searchTags = [
  "Làm gốm",
  "Vẽ tranh",
  "Đan móc",
  "Nến thơm",
  "Làm da",
  "Thêu thùa",
];

const categoryIcons = ["🏺", "🎨", "🧶", "🕯️", "👜", "🖌️", "🪵", "🧵"];

const experienceCollections = [
  {
    eyebrow: "Chậm lại một chút",
    title: "Tự tay làm nên một món đồ thật riêng",
    description:
      "Những workshop thủ công nhẹ nhàng để bạn tập trung vào niềm vui sáng tạo.",
    icon: Sparkles,
    categoryIndex: 0,
    tone: "bg-[#eef5e9] text-[#234734]",
  },
  {
    eyebrow: "Hẹn nhau cuối tuần",
    title: "Thêm một trải nghiệm vào câu chuyện của hai bạn",
    description:
      "Chọn một hoạt động mới mẻ để cùng bạn bè hoặc người thương tận hưởng.",
    icon: Heart,
    categoryIndex: 1,
    tone: "bg-[#fff1e8] text-[#7a3e24]",
  },
  {
    eyebrow: "Khám phá kỹ năng mới",
    title: "Bắt đầu từ tò mò, mang về một thành quả",
    description:
      "Không cần kinh nghiệm trước, nghệ nhân sẽ hướng dẫn bạn từng bước.",
    icon: Compass,
    categoryIndex: 2,
    tone: "bg-[#edf3fb] text-[#294765]",
  },
] as const;

const formatPrice = (price: number) => {
  return `${price.toLocaleString("vi-VN")}đ`;
};

const getScheduleTimestamp = (schedule: WorkshopSchedule) => {
  const timestamp = new Date(schedule.startAt).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

const getNextSchedule = (workshop: Workshop) => {
  const now = Date.now();

  return [...(workshop.schedules ?? [])]
    .filter((schedule) => {
      const timestamp = getScheduleTimestamp(schedule);

      return timestamp !== null && timestamp >= now;
    })
    .sort((first, second) => {
      return (
        (getScheduleTimestamp(first) ?? Number.MAX_SAFE_INTEGER) -
        (getScheduleTimestamp(second) ?? Number.MAX_SAFE_INTEGER)
      );
    })[0];
};

const getScheduleDate = (workshop: Workshop) => {
  const schedule = getNextSchedule(workshop);

  return schedule?.startAt;
};

const formatScheduleDate = (dateValue?: string) => {
  if (!dateValue) {
    return {
      day: "--",
      month: "THÁNG --",
      fullDate: "Chưa cập nhật",
    };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "THÁNG --",
      fullDate: "Chưa cập nhật",
    };
  }

  return {
    day: date.toLocaleDateString("vi-VN", {
      day: "2-digit",
    }),

    month: `THÁNG ${date.getMonth() + 1}`,

    fullDate: date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }),
  };
};

const formatScheduleTime = (workshop: Workshop) => {
  const schedule = getNextSchedule(workshop);

  if (!schedule) {
    return workshop.duration || "Đang cập nhật";
  }

  const startDate = new Date(schedule.startAt);

  if (Number.isNaN(startDate.getTime())) {
    return workshop.duration || "Đang cập nhật";
  }

  return startDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function HomePage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [totalWorkshops, setTotalWorkshops] = useState(0);

  const [loading, setLoading] = useState(true);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const searchSuggestions = useMemo(() => {
    const keyword = normalizeText(searchQuery);

    return [
      ...new Set(
        workshops
          .map((workshop) => workshop.title?.trim())
          .filter((title): title is string => Boolean(title)),
      ),
    ]
      .filter((title) => normalizeText(title).includes(keyword))
      .slice(0, 6);
  }, [workshops, searchQuery]);

  useEffect(() => {
    let mounted = true;

    const loadHomeWorkshops = async () => {
      try {
        setLoading(true);

        const data = await workshopService.getWorkshops({
          page: 1,
          limit: 12,
        });

        if (!mounted) {
          return;
        }

        setWorkshops(data.workshops ?? []);
        setTotalWorkshops(data.total ?? data.workshops?.length ?? 0);
      } catch (error) {
        console.error("Không thể tải workshop trang chủ:", error);

        if (mounted) {
          setWorkshops([]);
          setTotalWorkshops(0);
          toast.error("Không thể tải dữ liệu trang chủ");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadHomeWorkshops();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredWorkshops = useMemo(() => workshops, [workshops]);

  const latestWorkshops = useMemo(() => workshops.slice(4, 9), [workshops]);

  const upcomingWorkshops = useMemo(() => {
    return [...workshops]
      .filter((workshop) => getScheduleDate(workshop))
      .sort((first, second) => {
        const firstDate = new Date(getScheduleDate(first) ?? 0).getTime();

        const secondDate = new Date(getScheduleDate(second) ?? 0).getTime();

        return firstDate - secondDate;
      })
      .slice(0, 4);
  }, [workshops]);

  const homepageMetrics = useMemo(() => {
    const categoryCount = new Set(
      workshops.flatMap((workshop) => workshop.categories ?? []),
    ).size;

    const availableSpots = workshops.reduce((total, workshop) => {
      const schedule = getNextSchedule(workshop);

      return total + (schedule?.spotsLeft ?? 0);
    }, 0);

    return [
      {
        value: totalWorkshops > 0 ? `${totalWorkshops}+` : "—",
        label: "workshop đang mở",
      },
      {
        value: categoryCount > 0 ? `${categoryCount}` : "—",
        label: "chủ đề sáng tạo",
      },
      {
        value:
          upcomingWorkshops.length > 0 ? `${upcomingWorkshops.length}` : "—",
        label: "lịch sắp diễn ra",
      },
      {
        value: availableSpots > 0 ? `${availableSpots}` : "—",
        label: "chỗ đang nhận đăng ký",
      },
    ];
  }, [totalWorkshops, upcomingWorkshops, workshops]);

  const upcomingShowcase = useMemo(
    () => upcomingWorkshops.slice(0, 3),
    [upcomingWorkshops],
  );

  const heroWorkshop = featuredWorkshops[0];

  const heroImage = heroWorkshop?.thumbnail?.url ?? "/placeholderWorkshop.jpg";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (searchAddress.trim()) {
      params.set("address", searchAddress.trim());
    }

    const query = params.toString();

    navigate(query ? `/workshops?${query}` : "/workshops");
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/workshops?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigationData={navigationData} />

      <main>
        <section className="border-b border-border bg-background px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1.1fr_0.85fr_0.7fr]">
            <div className="flex flex-col justify-center py-5 text-accent">
              <h1 className="max-w-2xl text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-[56px]">
                Kết nối bạn với những trải nghiệm thủ công đáng nhớ
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Khám phá workshop, gặp gỡ nghệ nhân và tự tay tạo nên những sản
                phẩm mang dấu ấn riêng.
              </p>

              <form
                onSubmit={handleSearch}
                className="mt-8 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={searchQuery}
                    autoComplete="off"
                    placeholder="Bạn muốn làm gì?"
                    onFocus={() => setShowSearchSuggestions(true)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setShowSearchSuggestions(false);
                      }, 150);
                    }}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowSearchSuggestions(true);
                    }}
                    className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
                  />

                  {showSearchSuggestions &&
                    searchQuery.trim() &&
                    searchSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl">
                        {searchSuggestions.map((title) => (
                          <button
                            key={title}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSearchQuery(title);
                              setShowSearchSuggestions(false);
                            }}
                            className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-muted"
                          >
                            {title}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <div className="relative min-w-0 flex-1 border-t border-border sm:border-l sm:border-t-0">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={searchAddress}
                    onChange={(event) => setSearchAddress(event.target.value)}
                    placeholder="Địa điểm"
                    className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-primary px-7 text-primary-foreground hover:bg-primary/90"
                >
                  Tìm kiếm
                </Button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-muted-foreground">
                  Xu hướng tìm kiếm:
                </span>

                {searchTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleCategoryClick(tag)}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-accent/10 hover:text-accent"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-muted lg:min-h-[430px]">
              <img
                src={heroImage}
                alt={heroWorkshop?.title ?? "Workshop thủ công"}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-card/90 p-4 shadow-lg backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gợi ý dành cho bạn
                </p>

                <div className="mt-1 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="line-clamp-2 text-lg font-bold text-foreground">
                      {heroWorkshop?.title ??
                        "Thư giãn cuối tuần với một điều bạn yêu"}
                    </h2>

                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {heroWorkshop?.location?.address ??
                        "Khám phá nhiều workshop sáng tạo"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      heroWorkshop
                        ? navigate(`/workshops/${heroWorkshop._id}`)
                        : navigate("/workshops")
                    }
                    className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Khám phá
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative overflow-hidden rounded-[24px] bg-secondary p-6">
                <div className="relative z-10 max-w-[65%]">
                  <Store className="mb-4 size-7 text-primary" />

                  <h2 className="text-xl font-bold">
                    Dành cho Studio và đơn vị tổ chức
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Đăng workshop dễ dàng và tiếp cận cộng đồng yêu thích trải
                    nghiệm sáng tạo.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/workshops/create")}
                    className="mt-5 rounded-full border-border bg-card/70 text-foreground hover:bg-muted"
                  >
                    Tạo workshop
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>

                <div className="absolute -bottom-9 -right-8 size-44 rounded-full bg-primary/10" />
                <Store className="absolute bottom-8 right-8 size-20 text-primary/30" />
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-accent/10 p-6">
                <div className="relative z-10 max-w-[68%]">
                  <Gift className="mb-4 size-7 text-accent" />

                  <h2 className="text-xl font-bold text-foreground">
                    Ưu đãi dành cho bạn
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Khám phá các chương trình ưu đãi dành cho thành viên WOPI.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/workshops")}
                    className="mt-5 rounded-full border-accent/30 bg-card/60 text-accent hover:bg-accent/10"
                  >
                    Xem ưu đãi
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>

                <Gift className="absolute bottom-6 right-6 size-24 text-accent/30" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] gap-3 overflow-x-auto pb-1">
            {CATEGORIES.slice(0, 8).map((category, index) => (
              <button
                key={category.name}
                type="button"
                onClick={() => handleCategoryClick(category.name)}
                className="flex min-w-fit items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-xl">
                  {categoryIcons[index % categoryIcons.length]}
                </span>

                {category.name}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate("/workshops")}
              className="ml-auto flex min-w-fit items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Grid2X2 className="size-5" />
              </span>
              Xem tất cả
            </button>
          </div>
        </section>

        <section
          aria-labelledby="home-overview-title"
          className="bg-muted/30 px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[28px] border border-border bg-card shadow-sm lg:grid-cols-[1.05fr_1fr]">
            <div className="relative overflow-hidden bg-accent px-7 py-9 text-accent-foreground sm:px-10 lg:py-12">
              <div className="relative z-10 max-w-xl">
                <h2
                  id="home-overview-title"
                  className="mt-5 text-3xl font-black tracking-tight sm:text-4xl"
                >
                  Một nơi để bắt đầu mọi cảm hứng sáng tạo
                </h2>

                <p className="mt-4 max-w-lg text-sm leading-7 text-accent-foreground/75 sm:text-base">
                  Tìm đúng chủ đề, chọn lịch còn chỗ và đặt trải nghiệm trong
                  vài phút. Mọi thông tin quan trọng đều được hiển thị rõ ràng
                  trước khi bạn quyết định.
                </p>

                <Button
                  type="button"
                  onClick={() => navigate("/workshops")}
                  className="mt-7 rounded-full bg-background px-6 text-foreground hover:bg-background/90"
                >
                  Khám phá tất cả
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>

              <div className="absolute -bottom-28 -right-20 size-72 rounded-full border-[42px] border-accent-foreground/5" />
              <Sparkles className="absolute right-10 top-10 size-20 text-accent-foreground/10" />
            </div>

            <div className="grid grid-cols-2">
              {homepageMetrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={`flex min-h-36 flex-col justify-center px-6 py-7 sm:px-8 ${
                    index % 2 === 0 ? "border-r border-border" : ""
                  } ${index < 2 ? "border-b border-border" : ""}`}
                >
                  <strong className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    {metric.value}
                  </strong>

                  <span className="mt-2 text-sm leading-5 text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="experience-collections-title"
          className="px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading
              id="experience-collections-title"
              eyebrow="Gợi ý theo cảm hứng"
              title="Bạn muốn hôm nay của mình trông như thế nào?"
              description="Chọn một nhịp trải nghiệm phù hợp, WOPI sẽ đưa bạn đến những workshop đáng thử."
              actionLabel="Xem toàn bộ workshop"
              onAction={() => navigate("/workshops")}
            />

            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              {experienceCollections.map((collection) => {
                const Icon = collection.icon;
                const category = CATEGORIES[collection.categoryIndex]?.name;

                return (
                  <button
                    key={collection.title}
                    type="button"
                    onClick={() =>
                      category
                        ? handleCategoryClick(category)
                        : navigate("/workshops")
                    }
                    className={`group relative min-h-72 overflow-hidden rounded-[26px] p-7 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${collection.tone}`}
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white/65 shadow-sm">
                      <Icon className="size-6" />
                    </span>

                    <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] opacity-65">
                      {collection.eyebrow}
                    </p>

                    <h3 className="mt-3 max-w-sm text-2xl font-black leading-tight tracking-tight">
                      {collection.title}
                    </h3>

                    <p className="mt-4 max-w-sm text-sm leading-6 opacity-75">
                      {collection.description}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                      {category ?? "Khám phá ngay"}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>

                    <span className="absolute -bottom-16 -right-12 size-44 rounded-full bg-white/25" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Workshop nổi bật</h2>

                <button
                  type="button"
                  onClick={() => navigate("/workshops")}
                  className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
                >
                  Xem tất cả
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {loading ? (
                <LoadingBlock />
              ) : featuredWorkshops.length > 0 ? (
                <Carousel
                  plugins={[
                    Autoplay({
                      delay: 3800,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  opts={{
                    align: "start",
                    loop: featuredWorkshops.length > 4,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {featuredWorkshops.map((workshop) => (
                      <CarouselItem
                        key={workshop._id}
                        className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                      >
                        <WorkshopCard workshop={workshop} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  <CarouselPrevious className="hidden lg:flex" />
                  <CarouselNext className="hidden lg:flex" />
                </Carousel>
              ) : (
                <EmptyState message="Chưa có workshop nổi bật." />
              )}

              <div className="mb-5 mt-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Workshop mới đăng</h2>

                <button
                  type="button"
                  onClick={() => navigate("/workshops")}
                  className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
                >
                  Xem tất cả
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {loading ? (
                <LoadingBlock />
              ) : latestWorkshops.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {latestWorkshops.map((workshop) => (
                    <WorkshopCard key={workshop._id} workshop={workshop} />
                  ))}

                  <button
                    type="button"
                    onClick={() => navigate("/workshops")}
                    className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground transition hover:border-primary hover:bg-muted"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <ChevronRight className="size-6" />
                    </span>

                    <span className="mt-3 font-semibold">
                      Xem thêm workshop
                    </span>
                  </button>
                </div>
              ) : (
                <EmptyState message="Chưa có workshop nào được đăng." />
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm xl:sticky xl:top-24">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Workshop gần đây</h2>

                <button
                  type="button"
                  onClick={() => navigate("/workshops")}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Xem tất cả
                </button>
              </div>

              {loading ? (
                <LoadingBlock className="min-h-48" />
              ) : upcomingWorkshops.length > 0 ? (
                <div className="divide-y divide-border">
                  {upcomingWorkshops.map((workshop) => {
                    const scheduleDate = formatScheduleDate(
                      getScheduleDate(workshop),
                    );

                    return (
                      <button
                        key={workshop._id}
                        type="button"
                        onClick={() => navigate(`/workshops/${workshop._id}`)}
                        className="grid w-full grid-cols-[58px_1fr_56px] gap-3 py-4 text-left"
                      >
                        <div className="flex flex-col items-center justify-center rounded-xl bg-secondary px-2 py-2">
                          <span className="text-xl font-black">
                            {scheduleDate.day}
                          </span>

                          <span className="text-[9px] font-bold text-muted-foreground">
                            {scheduleDate.month}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                            {workshop.title}
                          </h3>

                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {workshop.location?.address}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="size-3" />
                            {formatScheduleTime(workshop)}
                          </p>
                        </div>

                        <img
                          src={
                            workshop.thumbnail?.url ??
                            "/placeholderWorkshop.jpg"
                          }
                          alt={workshop.title}
                          className="size-14 rounded-xl object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Chưa có lịch workshop.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/workshops")}
                className="mt-4 w-full rounded-xl"
              >
                Xem thêm workshop
              </Button>
            </aside>
          </div>
        </section>

        <section
          aria-labelledby="upcoming-showcase-title"
          className="bg-secondary/45 px-4 py-12 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1440px]">
            <SectionHeading
              id="upcoming-showcase-title"
              eyebrow="Đặt lịch dễ dàng"
              title="Những lịch workshop sắp diễn ra"
              description="Xem nhanh thời gian, địa điểm, giá và số chỗ còn lại trước khi mở trang chi tiết."
              actionLabel="Xem toàn bộ lịch"
              onAction={() => navigate("/workshops")}
            />

            <div className="mt-7">
              {loading ? (
                <LoadingBlock className="min-h-72" />
              ) : upcomingShowcase.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-3">
                  {upcomingShowcase.map((workshop) => {
                    const schedule = getNextSchedule(workshop);
                    const scheduleDate = formatScheduleDate(schedule?.startAt);
                    const isAlmostFull =
                      schedule !== undefined &&
                      schedule.spotsLeft > 0 &&
                      schedule.spotsLeft <= 3;

                    return (
                      <article
                        key={workshop._id}
                        className="group overflow-hidden rounded-[24px] border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/workshops/${workshop._id}`)}
                          className="relative block h-52 w-full overflow-hidden text-left"
                          aria-label={`Xem ${workshop.title}`}
                        >
                          <img
                            src={
                              workshop.thumbnail?.url ??
                              "/placeholderWorkshop.jpg"
                            }
                            alt={workshop.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                          <div className="absolute left-4 top-4 flex overflow-hidden rounded-xl bg-background/95 shadow-lg backdrop-blur">
                            <span className="flex min-w-14 flex-col items-center justify-center px-3 py-2">
                              <strong className="text-xl font-black leading-none text-foreground">
                                {scheduleDate.day}
                              </strong>
                              <span className="mt-1 text-[9px] font-bold text-muted-foreground">
                                {scheduleDate.month}
                              </span>
                            </span>
                          </div>

                          {isAlmostFull && (
                            <span className="absolute bottom-4 left-4 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">
                              Sắp hết chỗ
                            </span>
                          )}
                        </button>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                                {workshop.categories?.[0] ??
                                  "Workshop sáng tạo"}
                              </p>

                              <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-foreground">
                                {workshop.title}
                              </h3>
                            </div>

                            <span className="shrink-0 text-base font-black text-foreground">
                              {formatPrice(workshop.price)}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Clock3 className="size-4 shrink-0 text-primary" />
                              {formatScheduleTime(workshop)}
                              {workshop.duration
                                ? ` · ${workshop.duration}`
                                : ""}
                            </p>

                            <p className="flex items-center gap-2">
                              <MapPin className="size-4 shrink-0 text-primary" />
                              <span className="line-clamp-1">
                                {workshop.location.address}
                              </span>
                            </p>

                            <p className="flex items-center gap-2">
                              <Users className="size-4 shrink-0 text-primary" />
                              {schedule && schedule.spotsLeft > 0
                                ? `Còn ${schedule.spotsLeft} chỗ`
                                : "Đã hết chỗ"}
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={() =>
                              navigate(`/workshops/${workshop._id}`)
                            }
                            className="mt-5 w-full rounded-xl"
                          >
                            Xem chi tiết
                            <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="Chưa có lịch workshop sắp diễn ra." />
              )}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="booking-journey-title"
          className="px-4 py-12 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-8 rounded-[28px] border border-border bg-card p-6 shadow-sm lg:grid-cols-[0.78fr_1.22fr] lg:p-10">
              <div className="flex flex-col justify-between rounded-[22px] bg-foreground p-7 text-background sm:p-9">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-background/65">
                    <ShieldCheck className="size-4" />
                    Quy trình rõ ràng
                  </span>

                  <h2
                    id="booking-journey-title"
                    className="mt-4 text-3xl font-black tracking-tight"
                  >
                    Từ cảm hứng đến một chỗ ngồi chỉ trong 3 bước
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-background/65">
                    Bạn luôn biết mình đang chọn workshop nào, lịch nào và còn
                    bao nhiêu chỗ trước khi xác nhận.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate("/workshops")}
                  className="mt-8 w-fit rounded-full bg-background text-foreground hover:bg-background/90"
                >
                  Bắt đầu khám phá
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <JourneyStep
                  step="01"
                  icon={<Search className="size-5" />}
                  title="Tìm đúng trải nghiệm"
                  description="Lọc theo từ khóa, danh mục hoặc địa điểm phù hợp với kế hoạch của bạn."
                />

                <JourneyStep
                  step="02"
                  icon={<CalendarDays className="size-5" />}
                  title="Chọn lịch còn chỗ"
                  description="Kiểm tra thời gian, số chỗ và thông tin workshop trước khi đặt."
                />

                <JourneyStep
                  step="03"
                  icon={<TicketCheck className="size-5" />}
                  title="Quản lý booking tập trung"
                  description="Theo dõi workshop đã đặt và sử dụng mã check-in ngay trong tài khoản."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[28px] bg-[#f3eadf] lg:grid-cols-[1fr_0.8fr]">
            <div className="px-7 py-10 sm:px-10 lg:py-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                <BadgeCheck className="size-4 text-primary" />
                Dành cho host
              </span>

              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Biến kỹ năng của bạn thành một workshop đáng nhớ
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Tạo trang workshop, quản lý lịch, booking và check-in trên cùng
                một hệ thống. Bạn tập trung vào trải nghiệm, WOPI giúp phần vận
                hành trở nên gọn gàng hơn.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => navigate("/workshops/create")}
                  className="rounded-full px-6"
                >
                  Tạo workshop
                  <ArrowRight className="ml-2 size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/host")}
                  className="rounded-full border-foreground/15 bg-background/60 px-6"
                >
                  Tìm hiểu dành cho host
                </Button>
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden bg-primary p-8 text-primary-foreground">
              <Store className="absolute -bottom-10 -right-10 size-64 text-primary-foreground/10" />

              <div className="relative z-10 grid h-full content-center gap-4">
                <HostBenefit
                  icon={<BookOpen className="size-5" />}
                  title="Trang giới thiệu chuyên nghiệp"
                  description="Trình bày đầy đủ nội dung, lịch và địa điểm."
                />

                <HostBenefit
                  icon={<Users className="size-5" />}
                  title="Quản lý người tham dự"
                  description="Theo dõi booking và số chỗ theo từng lịch."
                />

                <HostBenefit
                  icon={<BadgeCheck className="size-5" />}
                  title="Check-in thuận tiện"
                  description="Xác nhận người tham dự bằng mã booking."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-4 rounded-[28px] bg-primary p-7 text-primary-foreground md:grid-cols-3">
            <FeatureItem
              icon={<Users className="size-6" />}
              title="Cộng đồng sáng tạo"
              description="Kết nối với người có chung sở thích."
            />

            <FeatureItem
              icon={<CalendarDays className="size-6" />}
              title="Lịch học linh hoạt"
              description="Dễ dàng lựa chọn thời gian phù hợp."
            />

            <FeatureItem
              icon={<Heart className="size-6" />}
              title="Trải nghiệm đáng nhớ"
              description="Tự tay tạo nên sản phẩm của riêng bạn."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

type LoadingBlockProps = {
  className?: string;
};

const LoadingBlock = ({ className = "min-h-56" }: LoadingBlockProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
};

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

const SectionHeading = ({
  id,
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: SectionHeadingProps) => {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>

        <h2
          id={id}
          className="mt-2 text-3xl font-black tracking-tight text-foreground"
        >
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-bold text-foreground transition hover:text-primary sm:self-auto"
      >
        {actionLabel}
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
};

type JourneyStepProps = {
  step: string;
  icon: ReactNode;
  title: string;
  description: string;
};

const JourneyStep = ({ step, icon, title, description }: JourneyStepProps) => {
  return (
    <div className="grid gap-4 rounded-[20px] border border-border bg-background p-5 sm:grid-cols-[52px_1fr_auto] sm:items-center sm:p-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>

      <div>
        <h3 className="font-black text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="hidden text-3xl font-black text-muted/80 sm:block">
        {step}
      </span>
    </div>
  );
};

type HostBenefitProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

const HostBenefit = ({ icon, title, description }: HostBenefitProps) => {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
        {icon}
      </div>

      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-primary-foreground/70">
          {description}
        </p>
      </div>
    </div>
  );
};

type FeatureItemProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-primary-foreground/5 p-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10">
        {icon}
      </div>

      <div>
        <h3 className="font-bold">{title}</h3>

        <p className="mt-1 text-sm text-primary-foreground/70">{description}</p>
      </div>
    </div>
  );
};

export default HomePage;
