import { CalendarDays, Clock3, Heart, MapPin, Star, Users, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

import type { Workshop } from "@/types/workshop";

type WorkshopCardData = Workshop & {
  sponsored?: boolean;
  averageRating?: number;
  reviewCount?: number;
  distanceMeters?: number;
};

type WorkshopCardProps = {
  workshop: WorkshopCardData;
  isFavorite?: boolean;
  onToggleFavorite?: (workshopId: string) => void;
};

const formatPrice = (price: number) => {
  if (price === 0) {
    return "Miễn phí";
  }

  return `${price.toLocaleString("vi-VN")}đ`;
};

const getNextSchedule = (workshop: Workshop) => {
  const currentTime = Date.now();

  return [...(workshop.schedules ?? [])]
    .map((schedule) => ({
      schedule,
      timestamp: new Date(schedule.startAt).getTime(),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.timestamp) && item.timestamp >= currentTime,
    )
    .sort((first, second) => first.timestamp - second.timestamp)[0]?.schedule;
};

const formatSchedule = (startAt: string) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "Thời gian chưa xác định";
  }

  return date.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortenAddress = (address?: string) => {
  if (!address) {
    return "Địa điểm đang cập nhật";
  }

  return address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(-2)
    .join(", ");
};

const WorkshopCard = ({
  workshop,
  isFavorite = false,
  onToggleFavorite,
}: WorkshopCardProps) => {
  const nextSchedule = getNextSchedule(workshop);

  const primaryCategory = workshop.categories?.[0] ?? "Workshop sáng tạo";

  const remainingCategoryCount = Math.max(
    0,
    (workshop.categories?.length ?? 0) - 1,
  );

  const averageRating = Math.min(5, Math.max(0, workshop.averageRating ?? 0));

  const reviewCount = Math.max(0, workshop.reviewCount ?? 0);
  const hasReviews = reviewCount > 0;

  const spotsLeft = nextSchedule?.spotsLeft ?? 0;
  const seatsTotal = nextSchedule?.seatsTotal ?? 0;
  const hasAvailableSpots = Boolean(nextSchedule && spotsLeft > 0);

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link
        to={`/workshops/${workshop._id}`}
        className="flex h-full flex-col"
        aria-label={`Xem workshop ${workshop.title}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={workshop.thumbnail?.url ?? "/placeholderWorkshop.jpg"}
            alt={workshop.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-64px)] flex-wrap gap-2">
            {workshop.sponsored && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow-soft">
                Quảng bá
              </span>
            )}

            <span className="max-w-40 truncate rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-primary shadow-soft backdrop-blur">
              {primaryCategory}
            </span>

            {remainingCategoryCount > 0 && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-muted-foreground shadow-soft backdrop-blur">
                +{remainingCategoryCount}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3">
            {nextSchedule ? (
              <span
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold shadow-soft backdrop-blur ${
                  hasAvailableSpots
                    ? "bg-background/90 text-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {hasAvailableSpots ? `Còn ${spotsLeft} chỗ` : "Đã hết chỗ"}
              </span>
            ) : (
              <span className="rounded-full bg-background/90 px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-soft backdrop-blur">
                Chưa có lịch mới
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 min-h-8 text-base font-bold leading-6 text-foreground transition-colors group-hover:text-primary">
            {workshop.title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />

            <span className="line-clamp-1">
              {typeof workshop.host === "string"
                ? `${workshop.host} · `
                : workshop.host?.displayName
                  ? `${workshop.host.displayName} · `
                  : ""}

              {shortenAddress(workshop.location?.address)}
            </span>
          </div>

          {workshop.distanceMeters !== undefined && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <Navigation className="size-3.5 shrink-0" />
              <span>Cách bạn {(workshop.distanceMeters / 1000).toFixed(1).replace('.', ',')} km</span>
            </div>
          )}
          {/* 
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {workshop.description}
          </p> */}

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {nextSchedule && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0 text-primary" />

                <span className="line-clamp-1">
                  {formatSchedule(nextSchedule.startAt)}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {workshop.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5 shrink-0" />
                  <span>{workshop.duration}</span>
                </div>
              )}

              {nextSchedule && (
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 shrink-0" />
                  <span>
                    {spotsLeft}/{seatsTotal} chỗ
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <p className="text-[11px] text-muted-foreground">Giá từ</p>

              <p className="mt-0.5 text-lg font-black text-primary">
                {formatPrice(workshop.price)}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Star
                className={
                  hasReviews
                    ? "size-4 fill-accent text-accent"
                    : "size-4 text-muted-foreground"
                }
              />

              {hasReviews ? (
                <>
                  <span className="font-semibold text-foreground">
                    {averageRating.toFixed(1)}
                  </span>

                  <span className="text-muted-foreground">({reviewCount})</span>
                </>
              ) : (
                <span className="text-muted-foreground">Chưa có đánh giá</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          aria-label={
            isFavorite
              ? "Xóa khỏi danh sách yêu thích"
              : "Thêm vào danh sách yêu thích"
          }
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(workshop._id)}
          className={`absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur transition hover:bg-background hover:text-accent ${
            isFavorite ? "text-accent" : "text-muted-foreground"
          }`}
        >
          <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      )}
    </article>
  );
};

export default WorkshopCard;
