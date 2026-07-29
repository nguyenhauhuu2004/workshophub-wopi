import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gift,
  Grid2X2,
  Heart,
  Loader2,
  MapPin,
  Search,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import Header, { type NavigationSection } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WorkshopCard from "@/components/WorkshopCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Autoplay from "embla-carousel-autoplay"; // 1. Import Autoplay

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { workshopService } from "@/services/workshopService";
import { CATEGORIES } from "@/data";

const normalizeText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
};

type WorkshopMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

type WorkshopSchedule = {
  _id?: string;
  startsAt?: string;
  endsAt?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  bookedCount?: number;
};

export type WorkshopListItem = {
  _id: string;
  title: string;
  category: string;
  description: string;

  price: number;
  duration: string;
  level: string;
  seatsTotal?: number;

  thumbnail?: WorkshopMedia;
  gallery?: WorkshopMedia[];
  schedules?: WorkshopSchedule[];

  host?: {
    _id?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  location: {
    address: string;

    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
  };

  createdAt?: string;
  updatedAt?: string;
};

type GetWorkshopsResponse = {
  workshops: WorkshopListItem[];
  total: number;
  page: number;
  totalPages: number;
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

const getScheduleDate = (workshop: WorkshopListItem) => {
  const schedule = workshop.schedules?.[0];

  return schedule?.startsAt ?? schedule?.date ?? workshop.createdAt;
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

const formatScheduleTime = (workshop: WorkshopListItem) => {
  const schedule = workshop.schedules?.[0];

  if (schedule?.startsAt) {
    const startDate = new Date(schedule.startsAt);
    const endDate = schedule.endsAt ? new Date(schedule.endsAt) : null;

    if (!Number.isNaN(startDate.getTime())) {
      const start = startDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (endDate && !Number.isNaN(endDate.getTime())) {
        const end = endDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return `${start} - ${end}`;
      }

      return start;
    }
  }

  if (schedule?.startTime) {
    return schedule.endTime
      ? `${schedule.startTime} - ${schedule.endTime}`
      : schedule.startTime;
  }

  return workshop.duration || "Đang cập nhật";
};

const HomePage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

  const [workshops, setWorkshops] = useState<WorkshopListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const searchSuggestions = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase("vi-VN");

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

        const data = (await workshopService.getWorkshops({
          page: 1,
          limit: 12,
        })) as GetWorkshopsResponse;

        if (!mounted) {
          return;
        }

        setWorkshops(data.workshops ?? []);
      } catch (error) {
        console.error("Không thể tải workshop trang chủ:", error);

        if (mounted) {
          setWorkshops([]);
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
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

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
                  // 2. Thêm plugin Autoplay vào đây
                  plugins={[
                    Autoplay({
                      delay: 1500, // Thời gian trượt (3.5 giây/lần)
                      stopOnInteraction: false, // Bấm/vuốt xong vẫn tiếp tục tự động trượt
                      stopOnMouseEnter: true, // Rê chuột vào thì tạm dừng để dễ xem
                    }),
                  ]}
                  opts={{
                    align: "start",
                    loop: true, // Bật loop để trượt vô tận
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
};

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
    <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
};

type FeatureItemProps = {
  icon: React.ReactNode;
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
