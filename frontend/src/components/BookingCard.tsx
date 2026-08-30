import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { BookingCardData, BookingSession } from "@/types/booking";

type BookingCardProps = {
  pricePerPerson: number;
  sessions: BookingSession[];
  location: string;

  taxRate?: number;
  disabled?: boolean;
  className?: string;

  onBook: (data: BookingCardData) => Promise<void> | void;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatSessionDate = (startAt: string) => {
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

const formatSessionTime = (startAt: string) => {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BookingCard = ({
  pricePerPerson,
  sessions,
  location,
  taxRate = 0.08,
  disabled = false,
  className = "",
  onBook,
}: BookingCardProps) => {
  const availableSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.spotsLeft > 0 &&
          new Date(session.startAt).getTime() > Date.now(),
      ),
    [sessions],
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [quantity, setQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);

  const selectedSession = useMemo(
    () =>
      availableSessions.find((session) => session.id === selectedSessionId) ??
      null,
    [availableSessions, selectedSessionId],
  );

  useEffect(() => {
    const currentStillExists = availableSessions.some(
      (session) => session.id === selectedSessionId,
    );

    if (!currentStillExists) {
      setSelectedSessionId(availableSessions[0]?.id ?? "");
    }
  }, [availableSessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedSession) {
      setQuantity(1);
      return;
    }

    setQuantity((current) =>
      Math.min(Math.max(current, 1), selectedSession.spotsLeft),
    );
  }, [selectedSession]);

  const subtotal = pricePerPerson * quantity;

  const taxAmount = Math.round(subtotal * taxRate);

  const grossAmount = subtotal + taxAmount;

  const increaseQuantity = () => {
    if (!selectedSession) {
      return;
    }

    setQuantity((current) => Math.min(current + 1, selectedSession.spotsLeft));
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    if (
      disabled ||
      submitting ||
      !selectedSession ||
      quantity < 1 ||
      quantity > selectedSession.spotsLeft
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await onBook({
        session: selectedSession,
        quantity,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitting = disabled || submitting;

  return (
    <div
      className={`rounded-3xl border bg-background p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div>
        <p className="text-sm text-muted-foreground">Giá mỗi người</p>

        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(pricePerPerson)}
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />

          <p className="text-sm font-semibold">Chọn lịch tổ chức</p>
        </div>

        {availableSessions.length > 0 ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {availableSessions.map((session) => {
              const selected = session.id === selectedSessionId;

              return (
                <button
                  key={session.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setQuantity(1);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {formatSessionDate(session.startAt)}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock3 className="size-4" />

                        <span>{formatSessionTime(session.startAt)}</span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        session.spotsLeft <= 3
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      Còn {session.spotsLeft} chỗ
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" />

                    <span>Tối đa {session.seatsTotal} người</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/40 p-5 text-center text-sm text-muted-foreground">
            Workshop hiện không có lịch còn chỗ
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Số lượng người</p>

        <div className="mt-3 flex items-center justify-between rounded-2xl border p-3">
          <button
            type="button"
            disabled={isSubmitting || quantity <= 1}
            onClick={decreaseQuantity}
            className="flex size-10 items-center justify-center rounded-xl border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Giảm số lượng"
          >
            <Minus className="size-4" />
          </button>

          <div className="text-center">
            <p className="text-xl font-bold">{quantity}</p>

            <p className="text-xs text-muted-foreground">người tham gia</p>
          </div>

          <button
            type="button"
            disabled={
              isSubmitting ||
              !selectedSession ||
              quantity >= selectedSession.spotsLeft
            }
            onClick={increaseQuantity}
            className="flex size-10 items-center justify-center rounded-xl border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Tăng số lượng"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl bg-muted/50 p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />

        <div>
          <p className="text-xs text-muted-foreground">Địa điểm</p>

          <p className="mt-1 text-sm font-medium">{location}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t pt-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {formatCurrency(pricePerPerson)} × {quantity}
          </span>

          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            Thuế ({Math.round(taxRate * 100)}
            %)
          </span>

          <span>{formatCurrency(taxAmount)}</span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-3">
          <span className="font-semibold">Tổng thanh toán</span>

          <span className="text-lg font-bold text-primary">
            {formatCurrency(grossAmount)}
          </span>
        </div>
      </div>

      <Button
        type="button"
        disabled={isSubmitting || !selectedSession}
        onClick={() => void handleSubmit()}
        className="mt-6 h-12 w-full rounded-xl text-base font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Đặt chỗ"
        )}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Bạn sẽ thanh toán trực tiếp tại địa điểm tổ chức.
      </p>
    </div>
  );
};

export default BookingCard;
