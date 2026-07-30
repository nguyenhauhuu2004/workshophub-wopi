import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  QrCode,
  TicketCheck,
  Users,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { bookingService } from "@/services/bookingService";

import type {
  Booking,
  BookingStatus,
  BookingWorkshopSummary,
} from "@/types/booking";

type BookingFilter =
  | "all"
  | "upcoming"
  | "checked_in"
  | "completed"
  | "cancelled";

const FILTERS: Array<{
  value: BookingFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Tất cả",
  },
  {
    value: "upcoming",
    label: "Sắp diễn ra",
  },
  {
    value: "checked_in",
    label: "Đã check-in",
  },
  {
    value: "completed",
    label: "Hoàn thành",
  },
  {
    value: "cancelled",
    label: "Đã hủy",
  },
];

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Chờ thanh toán",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không tham gia",
  refunded: "Đã hoàn tiền",
};

const BOOKING_STATUS_CLASSES: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  checked_in: "bg-blue-50 text-blue-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
  refunded: "bg-purple-50 text-purple-700",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (startAt: string) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "Ngày không hợp lệ";
  }

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (startAt: string) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getWorkshop = (booking: Booking): BookingWorkshopSummary | null => {
  if (typeof booking.workshop === "string") {
    return null;
  }

  return booking.workshop;
};

const isUpcomingBooking = (booking: Booking) => {
  const startAt = new Date(booking.sessionSnapshot.startAt);

  return (
    !Number.isNaN(startAt.getTime()) &&
    startAt.getTime() > Date.now() &&
    (booking.status === "confirmed" || booking.status === "pending_payment")
  );
};

const canShowCheckInTicket = (booking: Booking) => {
  return booking.status === "confirmed" || booking.status === "checked_in";
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [activeFilter, setActiveFilter] = useState<BookingFilter>("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await bookingService.getMyBookings({
          page: 1,
          limit: 50,
        });

        if (active) {
          setBookings(response.bookings);
        }
      } catch (loadError) {
        console.error("Load bookings error:", loadError);

        if (active) {
          setError("Không thể tải danh sách booking");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      active = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "all") {
      return bookings;
    }

    if (activeFilter === "upcoming") {
      return bookings.filter(isUpcomingBooking);
    }

    if (activeFilter === "cancelled") {
      return bookings.filter(
        (booking) =>
          booking.status === "cancelled" || booking.status === "refunded",
      );
    }

    return bookings.filter((booking) => booking.status === activeFilter);
  }, [bookings, activeFilter]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Booking của tôi
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Workshop đã đặt
        </h1>

        <p className="mt-3 text-muted-foreground">
          Xem lịch workshop, thông tin thanh toán và vé check-in của bạn.
        </p>
      </header>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && filteredBookings.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed p-10 text-center">
          <TicketCheck className="mx-auto size-12 text-muted-foreground" />

          <h2 className="mt-4 text-xl font-semibold">Chưa có booking</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Bạn chưa có workshop phù hợp với bộ lọc này.
          </p>

          <Link
            to="/workshops"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
          >
            Khám phá workshop
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {filteredBookings.map((booking) => {
          const workshop = getWorkshop(booking);

          return (
            <article
              key={booking._id}
              className="overflow-hidden rounded-3xl border bg-background shadow-sm"
            >
              <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="aspect-video bg-muted md:aspect-auto">
                  {workshop?.thumbnail?.url ? (
                    <img
                      src={workshop.thumbnail.url}
                      alt={workshop.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-44 items-center justify-center text-muted-foreground">
                      <TicketCheck className="size-10" />
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {booking.bookingCode}
                      </p>

                      <h2 className="mt-2 text-xl font-bold">
                        {workshop?.title ?? "Workshop"}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        BOOKING_STATUS_CLASSES[booking.status]
                      }`}
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Ngày tổ chức
                        </p>

                        <p className="mt-1 font-medium capitalize">
                          {formatDate(booking.sessionSnapshot.startAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Giờ bắt đầu
                        </p>

                        <p className="mt-1 font-medium">
                          {formatTime(booking.sessionSnapshot.startAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 size-4 shrink-0 text-primary" />

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Số người
                        </p>

                        <p className="mt-1 font-medium">
                          {booking.quantity} người
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Địa điểm
                        </p>

                        <p className="mt-1 line-clamp-2 font-medium">
                          {workshop?.location.address ?? "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t pt-5">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tổng thanh toán
                      </p>

                      <p className="mt-1 text-lg font-bold text-primary">
                        {formatCurrency(booking.grossAmount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workshop && (
                        <Link
                          to={`/workshops/${workshop._id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          Xem workshop
                        </Link>
                      )}

                      {canShowCheckInTicket(booking) && (
                        <Button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <QrCode className="mr-2 size-4" />
                          Vé check-in
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedBooking && (
        <CheckInTicketModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </main>
  );
}

type CheckInTicketModalProps = {
  booking: Booking;
  onClose: () => void;
};

function CheckInTicketModal({ booking, onClose }: CheckInTicketModalProps) {
  const workshop = getWorkshop(booking);

  const qrValue = `WOPY_CHECKIN:${booking.bookingCode}`;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-muted transition hover:bg-muted/80"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        <div className="text-center">
          {booking.status === "checked_in" ? (
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <CheckCircle2 className="size-7" />
            </div>
          ) : (
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <QrCode className="size-7" />
            </div>
          )}

          <h2 className="mt-4 text-2xl font-bold">
            {booking.status === "checked_in" ? "Đã check-in" : "Vé check-in"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {workshop?.title ?? "Workshop"}
          </p>
        </div>

        <div className="mx-auto mt-6 flex w-fit rounded-2xl border bg-white p-4">
          <QRCodeSVG value={qrValue} size={220} level="H" marginSize={1} />
        </div>

        <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Mã booking</p>

          <p className="mt-1 font-mono text-lg font-bold tracking-wider">
            {booking.bookingCode}
          </p>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Lịch</span>

            <span className="text-right font-medium">
              {formatDate(booking.sessionSnapshot.startAt)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Thời gian</span>

            <span className="font-medium">
              {formatTime(booking.sessionSnapshot.startAt)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Số người</span>

            <span className="font-medium">{booking.quantity}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Đưa mã QR này cho host khi đến workshop. Không chia sẻ vé với người
          khác.
        </p>
      </div>
    </div>
  );
}
