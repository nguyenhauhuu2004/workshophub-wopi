import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import Footer from "@/components/layout/footer";
import Header, { type NavigationSection } from "@/components/layout/header";

import WorkshopCard from "@/components/WorkshopCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CATEGORIES } from "@/data";
import { workshopService } from "@/services/workshopService";

import type {
  GetWorkshopsResponse,
  WorkshopSearchParams,
  WorkshopSort,
} from "@/types/workshopQuery";

const PAGE_SIZE = 12;

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

const areas = [
  "Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Huế",
  "Đà Lạt",
  "Bình Dương",
  "Đồng Nai",
];

const sortOptions: Array<{
  value: WorkshopSort;
  label: string;
}> = [
  {
    value: "newest",
    label: "Mới nhất",
  },
  {
    value: "rating_desc",
    label: "Đánh giá cao nhất",
  },
  {
    value: "price_asc",
    label: "Giá thấp đến cao",
  },
  {
    value: "price_desc",
    label: "Giá cao đến thấp",
  },
];

const quickPriceFilters = [
  {
    label: "Dưới 300.000đ",
    min: "",
    max: "300000",
  },
  {
    label: "300.000đ – 500.000đ",
    min: "300000",
    max: "500000",
  },
  {
    label: "500.000đ – 1.000.000đ",
    min: "500000",
    max: "1000000",
  },
  {
    label: "Trên 1.000.000đ",
    min: "1000000",
    max: "",
  },
];

type PageToken = number | "left-ellipsis" | "right-ellipsis";

const getPageTokens = (
  currentPage: number,
  totalPages: number,
): PageToken[] => {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  const tokens: PageToken[] = [1];

  if (currentPage > 4) {
    tokens.push("left-ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (currentPage < totalPages - 3) {
    tokens.push("right-ellipsis");
  }

  tokens.push(totalPages);

  return tokens;
};

const getNumberParam = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getDateRange = (dateValue: string) => {
  if (!dateValue) {
    return null;
  }

  const startDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const endDate = new Date(startDate);

  endDate.setDate(endDate.getDate() + 1);

  return {
    dateFrom: startDate.toISOString(),

    dateTo: endDate.toISOString(),
  };
};

const formatMoney = (value: string) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return value;
  }

  return `${numberValue.toLocaleString("vi-VN")}đ`;
};

const isRequestCancelled = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "CanceledError" || error.name === "AbortError";
};

export default function WorkshopsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchValue = searchParams.get("search") ?? "";

  const category = searchParams.get("category") ?? "";

  const area = searchParams.get("area") ?? "";

  const date = searchParams.get("date") ?? "";

  const minPrice = searchParams.get("minPrice") ?? "";

  const maxPrice = searchParams.get("maxPrice") ?? "";

  const minRating = getNumberParam(searchParams.get("minRating"), 0);

  const currentPage = Math.max(
    1,
    Math.floor(getNumberParam(searchParams.get("page"), 1)),
  );

  const rawSort = searchParams.get("sort") ?? "newest";

  const sort = sortOptions.some((item) => item.value === rawSort)
    ? (rawSort as WorkshopSort)
    : "newest";

  const [searchInput, setSearchInput] = useState(searchValue);

  const [minPriceInput, setMinPriceInput] = useState(minPrice);

  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<GetWorkshopsResponse>({
    workshops: [],
    total: 0,
    page: 1,
    totalPages: 0,
    limit: PAGE_SIZE,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setMinPriceInput(minPrice);

    setMaxPriceInput(maxPrice);
  }, [maxPrice, minPrice]);

  const updateSearchParams = useCallback(
    (
      updates: Record<string, string | number | null | undefined>,

      resetPage = true,
    ) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });

        if (resetPage) {
          next.delete("page");
        }

        return next;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();

      if (normalizedSearch !== searchValue) {
        updateSearchParams({
          search: normalizedSearch || null,
        });
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput, searchValue, updateSearchParams]);

  const queryKey = searchParams.toString();

  useEffect(() => {
    const controller = new AbortController();

    const loadWorkshops = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateRange = getDateRange(date);

        const params: WorkshopSearchParams = {
          search: searchValue || undefined,

          category: category || undefined,

          area: area || undefined,

          minPrice: minPrice ? Number(minPrice) : undefined,

          maxPrice: maxPrice ? Number(maxPrice) : undefined,

          minRating: minRating > 0 ? minRating : undefined,

          dateFrom: dateRange?.dateFrom,

          dateTo: dateRange?.dateTo,

          sort,

          page: currentPage,

          limit: PAGE_SIZE,
        };

        const response = await workshopService.getWorkshops(
          params,
          controller.signal,
        );

        setData(response);

        if (response.totalPages > 0 && currentPage > response.totalPages) {
          updateSearchParams(
            {
              page: response.totalPages,
            },
            false,
          );
        }
      } catch (requestError) {
        if (isRequestCancelled(requestError)) {
          return;
        }

        console.error("Load workshops error:", requestError);

        setError("Không thể tải danh sách workshop");

        toast.error("Không thể tải danh sách workshop");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadWorkshops();

    return () => {
      controller.abort();
    };
  }, [
    area,
    category,
    currentPage,
    date,
    maxPrice,
    minPrice,
    minRating,
    queryKey,
    reloadKey,
    searchValue,
    sort,
    updateSearchParams,
  ]);

  const applyPriceFilter = (customMin?: string, customMax?: string) => {
    const nextMin = customMin ?? minPriceInput.trim();

    const nextMax = customMax ?? maxPriceInput.trim();

    const numericMin = nextMin ? Number(nextMin) : 0;

    const numericMax = nextMax ? Number(nextMax) : Number.POSITIVE_INFINITY;

    if (
      (nextMin && (!Number.isFinite(numericMin) || numericMin < 0)) ||
      (nextMax && (!Number.isFinite(numericMax) || numericMax < 0))
    ) {
      toast.error("Khoảng giá không hợp lệ");

      return;
    }

    if (numericMin > numericMax) {
      toast.error("Giá tối thiểu không được lớn hơn giá tối đa");

      return;
    }

    setMinPriceInput(nextMin);
    setMaxPriceInput(nextMax);

    updateSearchParams({
      minPrice: nextMin || null,

      maxPrice: nextMax || null,
    });
  };

  const clearPriceFilter = useCallback(() => {
    setMinPriceInput("");
    setMaxPriceInput("");

    updateSearchParams({
      minPrice: null,
      maxPrice: null,
    });
  }, [updateSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");

    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateSearchParams({
      search: searchInput.trim() || null,
    });
  };

  const changePage = (page: number) => {
    if (page < 1 || page > data.totalPages || page === currentPage) {
      return;
    }

    updateSearchParams(
      {
        page,
      },
      false,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const activeFilters = useMemo(() => {
    const filters: Array<{
      key: string;
      label: string;
      clear: () => void;
    }> = [];

    if (searchValue) {
      filters.push({
        key: "search",

        label: `Tìm: ${searchValue}`,

        clear: () => {
          setSearchInput("");

          updateSearchParams({
            search: null,
          });
        },
      });
    }

    if (category) {
      filters.push({
        key: "category",
        label: category,

        clear: () =>
          updateSearchParams({
            category: null,
          }),
      });
    }

    if (area) {
      filters.push({
        key: "area",
        label: area,

        clear: () =>
          updateSearchParams({
            area: null,
          }),
      });
    }

    if (minPrice || maxPrice) {
      filters.push({
        key: "price",

        label:
          minPrice && maxPrice
            ? `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`
            : minPrice
              ? `Từ ${formatMoney(minPrice)}`
              : `Đến ${formatMoney(maxPrice)}`,

        clear: clearPriceFilter,
      });
    }

    if (minRating > 0) {
      filters.push({
        key: "rating",

        label: `Từ ${minRating} sao`,

        clear: () =>
          updateSearchParams({
            minRating: null,
          }),
      });
    }

    if (date) {
      filters.push({
        key: "date",

        label: new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN"),

        clear: () =>
          updateSearchParams({
            date: null,
          }),
      });
    }

    return filters;
  }, [
    area,
    category,
    clearPriceFilter,
    date,
    maxPrice,
    minPrice,
    minRating,
    searchValue,
    updateSearchParams,
  ]);

  const filterPanelProps: FilterPanelProps = {
    category,
    area,
    date,
    minRating,
    minPriceInput,
    maxPriceInput,

    onCategoryChange: (value) =>
      updateSearchParams({
        category: value || null,
      }),

    onAreaChange: (value) =>
      updateSearchParams({
        area: value || null,
      }),

    onDateChange: (value) =>
      updateSearchParams({
        date: value || null,
      }),

    onRatingChange: (value) =>
      updateSearchParams({
        minRating: value > 0 ? value : null,
      }),

    onMinPriceInputChange: setMinPriceInput,

    onMaxPriceInputChange: setMaxPriceInput,

    onApplyPrice: applyPriceFilter,

    onClearPrice: clearPriceFilter,

    onClearAll: clearAllFilters,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigationData={navigationData} />

      <main>
        <section className="border-b border-border bg-secondary/40 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Khám phá trải nghiệm
            </span>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Tìm workshop phù hợp với bạn
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Tìm kiếm theo sở thích, khu vực, ngân sách, đánh giá và ngày bạn
              muốn tham gia.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="mt-7 flex max-w-3xl gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Tìm theo tên hoặc nội dung workshop..."
                  className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
                />
              </div>

              <Button type="submit" className="h-12 rounded-xl px-6">
                Tìm kiếm
              </Button>
            </form>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Đang tìm workshop..."
                  : `Tìm thấy ${data.total.toLocaleString("vi-VN")} workshop`}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  // onClick={() => void useMyLocation()}
                  className="h-12 rounded-xl"
                >
                  {/* <Navigation className="mr-2 size-4" /> */}
                  Gần tôi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMobileFilters((current) => !current)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="mr-2 size-4" />
                  Bộ lọc
                  {activeFilters.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>

                <select
                  value={sort}
                  onChange={(event) =>
                    updateSearchParams({
                      sort: event.target.value,
                    })
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Sắp xếp workshop"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={filter.clear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary/70"
                  >
                    {filter.label}

                    <X className="size-3.5" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
                >
                  <RotateCcw className="size-3.5" />
                  Xóa tất cả
                </button>
              </div>
            )}

            {showMobileFilters && (
              <div className="mt-5 rounded-2xl border border-border bg-card p-5 lg:hidden">
                <FilterPanel {...filterPanelProps} />
              </div>
            )}

            <div className="mt-7 grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <FilterPanel {...filterPanelProps} />
                </div>
              </aside>

              <div className="min-w-0">
                {loading ? (
                  <WorkshopGridSkeleton />
                ) : error ? (
                  <ErrorState
                    message={error}
                    onRetry={() => setReloadKey((current) => current + 1)}
                  />
                ) : data.workshops.length > 0 ? (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {data.workshops.map((workshop) => (
                        <WorkshopCard key={workshop._id} workshop={workshop} />
                      ))}
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={data.totalPages}
                      onChange={changePage}
                    />
                  </>
                ) : (
                  <EmptyState onClear={clearAllFilters} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

type FilterPanelProps = {
  category: string;
  area: string;
  date: string;
  minRating: number;
  minPriceInput: string;
  maxPriceInput: string;

  onCategoryChange: (value: string) => void;

  onAreaChange: (value: string) => void;

  onDateChange: (value: string) => void;

  onRatingChange: (value: number) => void;

  onMinPriceInputChange: (value: string) => void;

  onMaxPriceInputChange: (value: string) => void;

  onApplyPrice: (min?: string, max?: string) => void;

  onClearPrice: () => void;
  onClearAll: () => void;
};

function FilterPanel({
  category,
  area,
  date,
  minRating,
  minPriceInput,
  maxPriceInput,
  onCategoryChange,
  onAreaChange,
  onDateChange,
  onRatingChange,
  onMinPriceInputChange,
  onMaxPriceInputChange,
  onApplyPrice,
  onClearPrice,
  onClearAll,
}: FilterPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-black">
          <SlidersHorizontal className="size-4" />
          Bộ lọc
        </h2>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          Đặt lại
        </button>
      </div>

      <FilterSection title="Danh mục">
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          <FilterRadio
            checked={!category}
            label="Tất cả danh mục"
            onClick={() => onCategoryChange("")}
          />

          {CATEGORIES.map((item) => (
            <FilterRadio
              key={item.name}
              checked={category === item.name}
              label={item.name}
              onClick={() => onCategoryChange(item.name)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Khoảng giá" icon={<Banknote className="size-4" />}>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            value={minPriceInput}
            onChange={(event) => onMinPriceInputChange(event.target.value)}
            placeholder="Từ"
          />

          <Input
            type="number"
            min={0}
            value={maxPriceInput}
            onChange={(event) => onMaxPriceInputChange(event.target.value)}
            placeholder="Đến"
          />
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onApplyPrice()}
            className="flex-1"
          >
            Áp dụng
          </Button>

          {(minPriceInput || maxPriceInput) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClearPrice}
            >
              Xóa
            </Button>
          )}
        </div>

        <div className="mt-3 space-y-1">
          {quickPriceFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => onApplyPrice(filter.min, filter.max)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Khu vực" icon={<MapPin className="size-4" />}>
        <select
          value={area}
          onChange={(event) => onAreaChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tất cả khu vực</option>

          {areas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="Đánh giá" icon={<Star className="size-4" />}>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRatingChange(minRating === value ? 0 : value)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                minRating === value
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${
                      star <= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-border"
                    }`}
                  />
                ))}
              </span>

              <span>Từ {value} sao</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Ngày tham gia"
        icon={<CalendarDays className="size-4" />}
      >
        <Input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />

        {date && (
          <button
            type="button"
            onClick={() => onDateChange("")}
            className="mt-2 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Xóa ngày đã chọn
          </button>
        )}
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-border pt-5 first:border-t-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </h3>

      {children}
    </div>
  );
}

function FilterRadio({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
        checked
          ? "bg-primary/10 font-bold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span
        className={`flex size-4 items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-border"
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>

      {label}
    </button>
  );
}

function WorkshopGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: PAGE_SIZE,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[16/9] animate-pulse bg-muted" />

          <div className="space-y-3 p-4">
            <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const tokens = getPageTokens(currentPage, totalPages);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Phân trang workshop"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {tokens.map((token) => {
        if (typeof token !== "number") {
          return (
            <span key={token} className="px-1 text-muted-foreground">
              …
            </span>
          );
        }

        return (
          <Button
            key={token}
            type="button"
            variant={token === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onChange(token)}
            aria-current={token === currentPage ? "page" : undefined}
          >
            {token}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center">
      <Search className="size-10 text-muted-foreground" />

      <h2 className="mt-4 text-xl font-black">Không tìm thấy workshop</h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Thử thay đổi từ khóa, khu vực, khoảng giá hoặc ngày tham gia.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="mt-5"
      >
        <RotateCcw className="mr-2 size-4" />
        Xóa bộ lọc
      </Button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
      <p className="font-bold text-destructive">{message}</p>

      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-4"
      >
        Thử lại
      </Button>
    </div>
  );
}
