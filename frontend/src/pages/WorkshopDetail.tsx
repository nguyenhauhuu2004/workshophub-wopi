import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Flame,
  LayoutDashboard,
  Loader2,
  MapPin,
  Pencil,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

import BookingCard, { type FullBookingData } from "@/components/BookingCard";
import MobileBookingDrawer from "@/components/MobileBookingDrawer";
import { Button } from "@/components/ui/button";

import type { BookingSession } from "@/types/booking";

import ThumbnailSlider, {
  type ProductMedia,
} from "@/components/thumnailslider";

import WorkshopReviews from "@/components/WorkshopReviews";
import WorkshopMapSection from "@/components/WorkshopMapSection";
import { workshopService } from "@/services/workshopService";
import { bookingService } from "@/services/bookingService";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";

import type { Workshop } from "@/types/workshop";
import { getWorkshopPriceInfo } from "@/utils/discountUtils";

const NEARBY_DISTANCE = 10_000;

export function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { user, setUser } = useAuthStore();

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

  /** Thông tin người tham dự mặc định: ưu tiên defaultAttendee > user profile */
  const defaultAttendee = useMemo(() => {
    if (!user) return undefined;
    if (user.defaultAttendee?.name) {
      return user.defaultAttendee;
    }
    return {
      name: user.displayName || user.username || "",
      email: user.email || "",
      phone: user.phone || "",
    };
  }, [user]);

  const handleBook = useCallback(
    async (bookingData: FullBookingData) => {
      if (!workshop || booking) {
        return;
      }

      if (user?.role === "host") {
        toast.error("Tài khoản Host không thể đặt vé workshop.");
        return;
      }

      if (
        !bookingData.attendeeInfo.name.trim() ||
        !bookingData.attendeeInfo.email.trim() ||
        !bookingData.attendeeInfo.phone.trim()
      ) {
        toast.error(
          "Vui lòng điền đầy đủ họ tên, email và số điện thoại người tham dự",
        );
        return;
      }

      try {
        setBooking(true);

        // Lưu thông tin mặc định nếu người dùng tích "Lưu cho lần sau"
        if (bookingData.saveAttendeeAsDefault && user) {
          try {
            await userService.saveDefaultAttendee({
              name: bookingData.attendeeInfo.name,
              email: bookingData.attendeeInfo.email,
              phone: bookingData.attendeeInfo.phone,
            });
            setUser({
              ...user,
              defaultAttendee: {
                name: bookingData.attendeeInfo.name,
                email: bookingData.attendeeInfo.email,
                phone: bookingData.attendeeInfo.phone,
              },
            });
          } catch (saveErr) {
            console.warn("Không thể lưu thông tin mặc định:", saveErr);
          }
        }

        const result = await bookingService.createBooking({
          workshopId: workshop._id,
          sessionId: bookingData.session.id,
          quantity: bookingData.quantity,
          paymentMethod: bookingData.paymentMethod,
          discountCode: bookingData.discountCode,
          attendeeName: bookingData.attendeeInfo.name,
          attendeeEmail: bookingData.attendeeInfo.email,
          attendeePhone: bookingData.attendeeInfo.phone,
        });

        toast.success(result.message ?? "Đặt chỗ thành công!");

        if (bookingData.paymentMethod === "pay_at_venue") {
          navigate("/my-bookings");
        } else {
          navigate(`/payment/${result.booking._id}`);
        }
      } catch (err) {
        console.error("Booking error:", err);

        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data?.message ?? "Không thể đặt chỗ");
          return;
        }

        toast.error("Không thể đặt chỗ");
      } finally {
        setBooking(false);
      }
    },
    [workshop, booking, user, navigate, setUser],
  );

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

  const priceInfo = useMemo(
    () => getWorkshopPriceInfo(workshop ?? undefined),
    [workshop],
  );

  const isHost = user?.role === "host";
  const hostId = workshop
    ? typeof workshop.host === "string"
      ? workshop.host
      : workshop.host?._id
    : null;
  const isOwnWorkshop = Boolean(isHost && user?._id && hostId === user._id);

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
    <main className="mx-auto w-full max-w-[1440px] px-4 pt-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
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

            {priceInfo.hasDiscount && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-sm dark:border-red-900/50 dark:bg-red-950/40">
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
                  <Flame className="size-3.5 fill-white" /> Giảm giá trực tiếp {priceInfo.discountBadge}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {priceInfo.originalPrice.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-lg font-black text-red-600 dark:text-red-400">
                  {priceInfo.finalPrice.toLocaleString("vi-VN")}đ / người
                </span>
                <span className="text-xs font-medium text-red-700/80 dark:text-red-300/80">
                  (Đã tự động trừ vào giá đặt chỗ)
                </span>
              </div>
            )}

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
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Vị trí & Chỉ đường
                </h2>
                <p className="text-sm text-muted-foreground">
                  Xem vị trí workshop trên bản đồ, các workshop lân cận và nhận
                  chỉ đường
                </p>
              </div>
            </div>

            <WorkshopMapSection
              currentWorkshop={workshop}
              nearbyWorkshops={nearbyWorkshops}
              onWorkshopClick={(workshopId) => {
                navigate(`/workshops/${workshopId}`);
              }}
            />
          </section>

          <WorkshopReviews workshopId={workshop._id} />
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-fit">
          {isHost ? (
            isOwnWorkshop ? (
              <div className="rounded-3xl border border-emerald-300 bg-gradient-to-b from-emerald-50/80 via-white to-stone-50 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#315d43] text-white shadow-xs">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Workshop của bạn
                  </span>
                </div>

                <h3 className="text-lg font-black text-stone-900">
                  Quản lý Workshop
                </h3>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  Bạn đang xem workshop dưới góc nhìn của học viên. Chức năng đặt vé và thanh toán bị vô hiệu hóa cho tài khoản Host.
                </p>

                <div className="my-5 space-y-2.5 rounded-2xl border border-stone-200/70 bg-stone-50/80 p-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Học phí:</span>
                    <span className="font-bold text-stone-900">
                      {workshop.price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Lịch tổ chức:</span>
                    <span className="font-bold text-stone-900">
                      {sessions.length} buổi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Thời lượng:</span>
                    <span className="font-bold text-stone-900">
                      {workshop.duration || "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Trạng thái:</span>
                    <span className="font-bold text-emerald-700 capitalize">
                      {workshop.status === "published"
                        ? "Đang mở đặt vé"
                        : workshop.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => navigate(`/workshops/${workshop._id}/edit`)}
                    className="w-full rounded-xl bg-[#315d43] hover:bg-[#284936] text-white font-bold"
                  >
                    <Pencil className="mr-2 size-4" />
                    Chỉnh sửa workshop & Lịch
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/host")}
                    className="w-full rounded-xl border-stone-300 font-semibold"
                  >
                    <LayoutDashboard className="mr-2 size-4 text-stone-600" />
                    Bảng điều khiển Host
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-stone-50 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                    <ShieldAlert className="size-4" />
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Tài khoản Host
                  </span>
                </div>

                <h3 className="text-lg font-black text-stone-900">
                  Không áp dụng đặt vé
                </h3>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  Bạn đang đăng nhập bằng tài khoản <strong className="text-stone-800">Host</strong>. Chức năng đặt vé và thanh toán chỉ áp dụng cho tài khoản <strong className="text-stone-800">Thành viên (Học viên)</strong>.
                </p>

                <div className="my-5 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-900">
                  💡 Để đặt chỗ tham gia workshop này, vui lòng đăng nhập bằng tài khoản người dùng thông thường.
                </div>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => navigate("/host")}
                    className="w-full rounded-xl bg-[#315d43] hover:bg-[#284936] text-white font-bold"
                  >
                    <LayoutDashboard className="mr-2 size-4" />
                    Về Bảng điều khiển Host của tôi
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/workshops")}
                    className="w-full rounded-xl border-stone-300 font-semibold"
                  >
                    Khám phá workshop khác
                  </Button>
                </div>
              </div>
            )
          ) : (
            <>
              <BookingCard
                className="h-fit"
                workshopId={workshop._id}
                pricePerPerson={priceInfo.finalPrice}
                sessions={sessions}
                taxRate={0}
                location={workshop.location.address}
                defaultAttendee={defaultAttendee}
                onBook={handleBook}
                disabled={booking}
              />

              {booking && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Đang xử lý đặt chỗ...
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {isHost ? (
        isOwnWorkshop ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-800">👑 Workshop của bạn</p>
                <p className="text-[11px] text-stone-500">
                  {workshop.price.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <Button
                onClick={() => navigate(`/workshops/${workshop._id}/edit`)}
                className="rounded-xl bg-[#315d43] hover:bg-[#284936] text-white font-bold text-xs px-4"
              >
                <Pencil className="mr-1.5 size-3.5" />
                Chỉnh sửa workshop
              </Button>
            </div>
          </div>
        ) : null
      ) : (
        <MobileBookingDrawer
          workshopId={workshop._id}
          pricePerPerson={priceInfo.finalPrice}
          originalPrice={priceInfo.hasDiscount ? priceInfo.originalPrice : undefined}
          sessions={sessions}
          location={workshop.location.address}
          defaultAttendee={defaultAttendee}
          disabled={booking}
          onBook={handleBook}
        />
      )}
    </main>
  );
}

export default WorkshopDetail;
