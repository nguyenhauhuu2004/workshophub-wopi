import { useEffect, useMemo, useRef, useState } from "react";

import "@goongmaps/goong-js/dist/goong-js.css";

import goongjs, {
  type Map as GoongMap,
  type Marker as GoongMarker,
} from "@goongmaps/goong-js";

import { CalendarDays, Clock3, Loader2, MapPin, Users } from "lucide-react";

import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

import BookingCard from "@/components/BookingCard";

import type { BookingCardData, BookingSession } from "@/types/booking";

import ThumbnailSlider, {
  type ProductMedia,
} from "@/components/thumnailslider";

import WorkshopReviews from "@/components/WorkshopReviews";
import { workshopService } from "@/services/workshopService";
import { bookingService } from "@/services/bookingService";

import type { Workshop } from "@/types/workshop";

const DEFAULT_MAP_ZOOM = 15;
const NEARBY_DISTANCE = 10_000;

// const formatScheduleDate = (startAt: string) => {
//   const date = new Date(startAt);

//   if (Number.isNaN(date.getTime())) {
//     return "Không xác định";
//   }

//   return date.toLocaleDateString("vi-VN", {
//     weekday: "short",
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   });
// };

// const formatScheduleTime = (startAt: string) => {
//   const date = new Date(startAt);

//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return date.toLocaleTimeString("vi-VN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

type GoongWorkshopMapProps = {
  workshop: Workshop;
  nearbyWorkshops: Workshop[];
  onWorkshopClick: (workshopId: string) => void;
};

function GoongWorkshopMap({
  workshop,
  nearbyWorkshops,
  onWorkshopClick,
}: GoongWorkshopMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<GoongMap | null>(null);

  const onWorkshopClickRef = useRef(onWorkshopClick);

  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    onWorkshopClickRef.current = onWorkshopClick;
  }, [onWorkshopClick]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY;

    if (!accessToken) {
      setMapError("Chưa cấu hình VITE_GOONG_MAPTILES_KEY");

      return;
    }

    const coordinates = workshop.location.coordinates.coordinates;

    const [longitude, latitude] = coordinates;

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      setMapError("Tọa độ workshop không hợp lệ");

      return;
    }

    setMapError(null);
    goongjs.accessToken = accessToken;

    const map = new goongjs.Map({
      container,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [longitude, latitude],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new goongjs.NavigationControl(), "top-right");

    mapRef.current = map;

    const bounds = new goongjs.LngLatBounds();

    const markers: GoongMarker[] = [];

    const addMarker = (item: Workshop, isCurrent: boolean) => {
      const [itemLongitude, itemLatitude] =
        item.location.coordinates.coordinates;

      if (!Number.isFinite(itemLongitude) || !Number.isFinite(itemLatitude)) {
        return;
      }

      const popup = new goongjs.Popup({
        offset: 24,
      }).setText(`${item.title} — ${item.location.address}`);

      const marker = new goongjs.Marker({
        color: isCurrent ? "#214c36" : "#d97706",
      })
        .setLngLat([itemLongitude, itemLatitude])
        .setPopup(popup)
        .addTo(map);

      if (!isCurrent) {
        const element = marker.getElement();

        element.style.cursor = "pointer";

        element.addEventListener("click", () => {
          onWorkshopClickRef.current(item._id);
        });
      }

      bounds.extend([itemLongitude, itemLatitude]);

      markers.push(marker);
    };

    addMarker(workshop, true);

    nearbyWorkshops.forEach((item) => {
      addMarker(item, false);
    });

    if (nearbyWorkshops.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: DEFAULT_MAP_ZOOM,
      });
    }

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });

      map.remove();
      mapRef.current = null;
    };
  }, [workshop, nearbyWorkshops]);

  if (mapError) {
    return (
      <div className="mt-5 flex h-[420px] items-center justify-center rounded-2xl border bg-muted px-6 text-center text-sm text-muted-foreground">
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mt-5 h-[420px] w-full overflow-hidden rounded-2xl border"
    />
  );
}

export function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);

  const [nearbyWorkshops, setNearbyWorkshops] = useState<Workshop[]>([]);

  const [loading, setLoading] = useState(true);

  const [booking, setBooking] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy mã workshop");
      setLoading(false);
      return;
    }

    let active = true;

    const loadWorkshop = async () => {
      try {
        setLoading(true);
        setError(null);

        const workshopData = await workshopService.getWorkshopById(id);

        if (!active) {
          return;
        }

        setWorkshop(workshopData);

        const [longitude, latitude] =
          workshopData.location.coordinates.coordinates;

        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          return;
        }

        try {
          const nearby = await workshopService.getNearbyWorkshops({
            longitude,
            latitude,
            distance: NEARBY_DISTANCE,
            excludeId: workshopData._id,
          });

          if (active) {
            setNearbyWorkshops(nearby);
          }
        } catch (nearbyError) {
          console.error("Không thể tải workshop gần đây:", nearbyError);
        }
      } catch (loadError) {
        console.error("Load workshop error:", loadError);

        if (active) {
          setError("Không thể tải thông tin workshop");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadWorkshop();

    return () => {
      active = false;
    };
  }, [id]);

  const media = useMemo<ProductMedia[]>(() => {
    if (!workshop) {
      return [];
    }

    const items: ProductMedia[] = [];

    if (workshop.thumbnail?.url) {
      items.push({
        id: workshop.thumbnail.publicId,
        type: "image",
        src: workshop.thumbnail.url,
        alt: workshop.title,
      });
    }

    workshop.gallery.forEach((item, index) => {
      items.push({
        id: item.publicId || `gallery-${index}`,
        type: "image",
        src: item.url,
        alt: `${workshop.title} - hình ${index + 1}`,
      });
    });

    if (workshop.video?.url) {
      items.push({
        id: workshop.video.publicId,
        type: "video",
        src: workshop.video.url,
        poster: workshop.thumbnail?.url,
        alt: `Video giới thiệu ${workshop.title}`,
        autoPlay: false,
        muted: false,
        loop: false,
      });
    }

    return items;
  }, [workshop]);
  const sessions = useMemo<BookingSession[]>(() => {
    if (!workshop) {
      return [];
    }

    return workshop.schedules.map((schedule, index) => ({
      id: schedule._id ?? `schedule-${index}`,

      startAt: schedule.startAt,

      seatsTotal: schedule.seatsTotal,

      spotsLeft: schedule.spotsLeft,
    }));
  }, [workshop]);

  const maximumSeats = useMemo(() => {
    if (!workshop?.schedules.length) {
      return 0;
    }

    return Math.max(
      ...workshop.schedules.map((schedule) => schedule.seatsTotal),
    );
  }, [workshop]);

  const handleBook = async (bookingData: BookingCardData) => {
    if (!workshop || booking) {
      return;
    }

    try {
      setBooking(true);

      const result = await bookingService.createBooking({
        workshopId: workshop._id,

        sessionId: bookingData.session.id,

        quantity: bookingData.quantity,
      });

      toast.success(result.message ?? "Đặt chỗ thành công");

      setWorkshop((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          schedules: current.schedules.map((schedule, index) => {
            const scheduleId = schedule._id ?? `schedule-${index}`;

            if (scheduleId !== bookingData.session.id) {
              return schedule;
            }

            return {
              ...schedule,

              spotsLeft: Math.max(0, schedule.spotsLeft - bookingData.quantity),
            };
          }),
        };
      });
    } catch (error) {
      console.error("Booking error:", error);

      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? "Không thể đặt chỗ");

        return;
      }

      toast.error("Không thể đặt chỗ");
    } finally {
      setBooking(false);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Không tìm thấy workshop</h1>

          <p className="mt-2 text-muted-foreground">
            {error ?? "Workshop không tồn tại hoặc đã bị xóa."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/workshops")}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {media.length > 0 ? (
            <ThumbnailSlider media={media} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              Workshop chưa có hình ảnh
            </div>
          )}

          <section className="mt-8">
            <div className="flex flex-wrap gap-2">
              {workshop.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {category}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {workshop.title}
            </h1>

            <p className="mt-8 whitespace-pre-line text-base leading-7 text-muted-foreground">
              {workshop.description}
            </p>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <Clock3 className="size-5 text-primary" />
              <p className="mt-3 text-xs text-muted-foreground">Thời lượng</p>
              <p className="mt-1 font-semibold">
                {workshop.duration || "Chưa cập nhật"}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <Users className="size-5 text-primary" />
              <p className="mt-3 text-xs text-muted-foreground">
                Sức chứa tối đa
              </p>
              <p className="mt-1 font-semibold">
                {maximumSeats > 0
                  ? `${maximumSeats} người / lịch`
                  : "Chưa cập nhật"}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <CalendarDays className="size-5 text-primary" />
              <p className="mt-3 text-xs text-muted-foreground">Lịch tổ chức</p>
              <p className="mt-1 font-semibold">
                {workshop.schedules.length} lịch
              </p>
            </div>
          </section>

          {workshop.highlights.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Điểm nổi bật</h2>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {workshop.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-xl bg-muted px-4 py-3 text-sm"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {workshop.includes.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Workshop bao gồm</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {workshop.includes.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border px-3 py-1.5 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 border-t pt-8">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-primary" />

              <div>
                <h2 className="text-2xl font-semibold">Vị trí workshop</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {workshop.location.address}
                </p>

                {workshop.location.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ghi chú: {workshop.location.notes}
                  </p>
                )}
              </div>
            </div>

            <GoongWorkshopMap
              workshop={workshop}
              nearbyWorkshops={nearbyWorkshops}
              onWorkshopClick={(workshopId) => {
                navigate(`/workshops/${workshopId}`);
              }}
            />
          </section>

          <WorkshopReviews workshopId={workshop._id} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <BookingCard
            className="h-fit"
            pricePerPerson={workshop.price}
            sessions={sessions}
            taxRate={0.08}
            location={workshop.location.address}
            onBook={handleBook}
            disabled={booking}
          />

          {booking && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang xử lý đặt chỗ...
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default WorkshopDetail;
