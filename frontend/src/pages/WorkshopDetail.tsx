import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import ThumbnailSlider, {
  type ProductMedia,
} from "@/components/thumnailslider";

import BookingCard, {
  type BookingData,
  type BookingSession,
} from "@/components/BookingCard";

import WorkshopContent from "@/components/WorkshopContent";
import WorkshopReviews from "@/components/WorkshopReviews";

import WorkshopMap, { type WorkshopLocation } from "@/components/workshopmap";

import { workshopService } from "@/services/workshopService";

export type WorkshopMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

export type WorkshopSchedule = {
  _id?: string;
  date: string;
  time: string;
  spotsLeft: number;
};

export type WorkshopDetailData = {
  _id: string;
  title: string;
  category: string;
  description: string;

  highlights: string[];
  includes: string[];

  thumbnail: WorkshopMedia | null;
  gallery: WorkshopMedia[];
  video: WorkshopMedia | null;

  price: number;
  duration: string;
  seatsTotal: number;
  level: string;

  averageRating?: number;
  reviewCount?: number;

  schedules: WorkshopSchedule[];

  location: {
    address: string;
    notes?: string;

    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
  };

  host?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
};

export function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState<WorkshopDetailData | null>(null);

  const [nearbyWorkshops, setNearbyWorkshops] = useState<WorkshopDetailData[]>(
    [],
  );

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

        const workshopData = await workshopService.getWorkshop(id);

        if (!active) return;

        setWorkshop(workshopData);

        const coordinates = workshopData.location?.coordinates?.coordinates;

        const longitude = coordinates?.[0];
        const latitude = coordinates?.[1];

        if (typeof longitude === "number" && typeof latitude === "number") {
          try {
            const nearby = await workshopService.getNearbyWorkshops({
              longitude,
              latitude,
              distance: 10_000,
              excludeId: workshopData._id,
            });

            if (active) {
              setNearbyWorkshops(nearby ?? []);
            }
          } catch (nearbyError) {
            console.error("Không thể tải workshop gần đây:", nearbyError);
          }
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
    if (!workshop) return [];

    const items: ProductMedia[] = [];

    if (workshop.thumbnail?.url) {
      items.push({
        id: workshop.thumbnail.publicId,
        type: "image",
        src: workshop.thumbnail.url,
        alt: workshop.title,
      });
    }

    workshop.gallery?.forEach((item, index) => {
      items.push({
        id: item.publicId || `gallery-${index}`,
        type: "image",
        src: item.url,
        alt: `${workshop.title} - hình ${index + 1}`,
      });
    });

    // if (workshop.video?.url) {
    //   items.push({
    //     id: workshop.video.publicId,
    //     type: "video",
    //     src: workshop.video.url,
    //     poster: workshop.thumbnail?.url,
    //     alt: `Video giới thiệu ${workshop.title}`,
    //     autoPlay: false,
    //     muted: false,
    //     loop: false,
    //   });
    // }

    return items;
  }, [workshop]);

  const sessions = useMemo<BookingSession[]>(() => {
    if (!workshop?.schedules) {
      return [];
    }

    return workshop.schedules.map((session, index) => ({
      id: session._id ?? `schedule-${index}`,
      date: session.date,
      time: session.time,
      remaining: session.spotsLeft,
    }));
  }, [workshop]);

  const currentWorkshop = useMemo<WorkshopLocation | null>(() => {
    if (!workshop) return null;

    const coordinates = workshop.location?.coordinates?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return null;
    }

    const [longitude, latitude] = coordinates;

    return {
      id: workshop._id,
      title: workshop.title,
      address: workshop.location.address,
      latitude,
      longitude,
      image: workshop.thumbnail?.url ?? "",
      price: workshop.price,
    };
  }, [workshop]);

  const nearbyMapData = useMemo<WorkshopLocation[]>(() => {
    return nearbyWorkshops.flatMap((item) => {
      const coordinates = item.location?.coordinates?.coordinates;

      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return [];
      }

      const [longitude, latitude] = coordinates;

      return [
        {
          id: item._id,
          title: item.title,
          address: item.location.address,
          latitude,
          longitude,
          image: item.thumbnail?.url ?? "",
          price: item.price,
        },
      ];
    });
  }, [nearbyWorkshops]);

  const handleBook = async (bookingData: BookingData) => {
    if (!workshop || booking) return;

    try {
      setBooking(true);

      const result = await workshopService.createBooking({
        workshopId: workshop._id,

        sessionId: String(bookingData.session.id),

        quantity: bookingData.quantity,
      });

      toast.success(result.message ?? "Đặt chỗ thành công");

      setWorkshop((current) => {
        if (!current) return current;

        return {
          ...current,

          schedules: current.schedules.map((session) =>
            session._id === String(bookingData.session.id)
              ? {
                  ...session,

                  spotsLeft: Math.max(
                    0,
                    session.spotsLeft - bookingData.quantity,
                  ),
                }
              : session,
          ),
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {workshop.category}
              </span>

              <span className="rounded-full bg-muted px-3 py-1 text-sm">
                {workshop.level}
              </span>

              {(workshop.reviewCount ?? 0) > 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                  ★ {(workshop.averageRating ?? 0).toFixed(1)}
                  {" · "}
                  {workshop.reviewCount} đánh giá
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {workshop.title}
            </h1>

            {workshop.host && (
              <div className="mt-4 flex items-center gap-3">
                {workshop.host.avatarUrl ? (
                  <img
                    src={workshop.host.avatarUrl}
                    alt={workshop.host.displayName}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {workshop.host.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">
                    Được tổ chức bởi
                  </p>

                  <p className="font-medium">{workshop.host.displayName}</p>
                </div>
              </div>
            )}

            <p className="mt-8 whitespace-pre-line text-base leading-7 text-muted-foreground">
              {workshop.description}
            </p>
          </section>

          <WorkshopContent
            highlights={workshop.highlights}
            includes={workshop.includes}
            duration={workshop.duration}
            level={workshop.level}
            seatsTotal={workshop.seatsTotal}
          />

          {currentWorkshop && (
            <section className="mt-10 border-t pt-8">
              <h2 className="text-2xl font-semibold">Vị trí workshop</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {workshop.location.address}
              </p>

              {workshop.location.notes && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ghi chú: {workshop.location.notes}
                </p>
              )}

              <WorkshopMap
                currentWorkshop={currentWorkshop}
                nearbyWorkshops={nearbyMapData}
                className="mt-5"
                onWorkshopClick={(selectedWorkshop) => {
                  navigate(`/workshops/${selectedWorkshop.id}`);
                }}
              />
            </section>
          )}

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
