import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Tag,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/axios";
import AttendeeInfoForm, { type AttendeeInfo } from "@/components/AttendeeInfoForm";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

import type { BookingCardData, BookingPaymentMethod, BookingSession } from "@/types/booking";

export type FullBookingData = BookingCardData & {
  paymentMethod: BookingPaymentMethod;
  attendeeInfo: AttendeeInfo;
  saveAttendeeAsDefault: boolean;
  discountCode?: string;
};

type BookingCardProps = {
  workshopId?: string;
  pricePerPerson: number;
  sessions: BookingSession[];
  location: string;
  defaultAttendee?: { name: string; email: string; phone: string };

  taxRate?: number;
  disabled?: boolean;
  className?: string;

  onBook: (data: FullBookingData) => Promise<void> | void;
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
  workshopId,
  pricePerPerson,
  sessions,
  location,
  defaultAttendee,
  taxRate: _taxRate = 0,
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
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod | "">("");
  const [paymentError, setPaymentError] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    message: string;
  } | null>(null);

  const attendeeInfoRef = useRef<AttendeeInfo>({
    name: defaultAttendee?.name ?? "",
    email: defaultAttendee?.email ?? "",
    phone: defaultAttendee?.phone ?? "",
  });
  const saveAsDefaultRef = useRef(false);

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

  // Callback ổn định để AttendeeInfoForm không re-render liên tục
  const handleAttendeeChange = useCallback(
    (info: AttendeeInfo, save: boolean) => {
      attendeeInfoRef.current = info;
      saveAsDefaultRef.current = save;
    },
    [],
  );

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (!workshopId) {
      toast.error("Không tìm thấy thông tin workshop");
      return;
    }
    try {
      setValidatingCoupon(true);
      const res = await api.post("/discounts/validate", {
        workshopId,
        code,
      });
      setAppliedCoupon(res.data);
      toast.success(`Đã áp dụng mã: ${res.data.message}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Mã giảm giá không hợp lệ");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const subtotal = pricePerPerson * quantity;
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : Math.min(appliedCoupon.value, subtotal)
    : 0;
  // Bỏ thuế VAT cho người dùng
  const grossAmount = Math.max(0, subtotal - discountAmount);

  const increaseQuantity = () => {
    if (!selectedSession) return;
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

    const info = attendeeInfoRef.current;

    if (!info.name.trim()) {
      toast.error("Vui lòng nhập họ tên người tham dự");
      return;
    }

    if (!info.email.trim()) {
      toast.error("Vui lòng nhập email người tham dự");
      return;
    }

    if (!info.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại người tham dự");
      return;
    }

    if (!paymentMethod) {
      setPaymentError(true);
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    try {
      setSubmitting(true);

      await onBook({
        session: selectedSession,
        quantity,
        paymentMethod,
        discountCode: appliedCoupon?.code,
        attendeeInfo: info,
        saveAttendeeAsDefault: saveAsDefaultRef.current,
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
      {/* Giá */}
      <div>
        <p className="text-sm text-muted-foreground">Giá mỗi người</p>

        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(pricePerPerson)}
        </p>
      </div>

      {/* Chọn lịch */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />

          <p className="text-sm font-semibold">Chọn lịch tổ chức</p>
        </div>

        {availableSessions.length > 0 ? (
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
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

      {/* Số lượng */}
      <div className="mt-5">
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

      {/* Địa điểm */}
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-muted/50 p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />

        <div>
          <p className="text-xs text-muted-foreground">Địa điểm</p>

          <p className="mt-1 text-sm font-medium">{location}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 border-t" />

      {/* Form thông tin người tham dự */}
      <AttendeeInfoForm
        defaultValues={defaultAttendee}
        onChange={handleAttendeeChange}
        disabled={isSubmitting}
      />

      <div className="my-5 border-t" />

      {/* Chọn phương thức thanh toán */}
      <PaymentMethodSelector
        value={paymentMethod}
        onChange={(method) => {
          setPaymentMethod(method);
          setPaymentError(false);
        }}
        disabled={isSubmitting}
        hasError={paymentError}
      />

      {/* Mã giảm giá */}
      <div className="mt-5 space-y-2 border-t pt-5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Tag className="size-3.5" /> Mã giảm giá (nếu có)
        </label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-600" />
              <span>
                <strong className="font-mono font-bold">{appliedCoupon.code}</strong>: {appliedCoupon.message}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="p-1 text-xs text-emerald-700 hover:text-red-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Nhập mã ưu đãi..."
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              disabled={isSubmitting || validatingCoupon}
              className="h-10 text-xs font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!couponInput.trim() || isSubmitting || validatingCoupon}
              onClick={handleApplyCoupon}
              className="h-10 shrink-0 px-4 text-xs font-semibold"
            >
              {validatingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : "Áp dụng"}
            </Button>
          </div>
        )}
      </div>

      {/* Tổng tiền */}
      <div className="mt-5 space-y-3 border-t pt-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {formatCurrency(pricePerPerson)} × {quantity}
          </span>

          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between gap-4 text-emerald-600 font-medium">
            <span className="flex items-center gap-1">
              <Tag className="size-3.5" /> Giảm giá ({appliedCoupon?.code})
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

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
        ) : paymentMethod === "qr" ? (
          "Đặt chỗ & Thanh toán QR"
        ) : paymentMethod === "pay_at_venue" ? (
          "Đặt chỗ & Nhận vé ngay"
        ) : (
          "Xác nhận đặt chỗ"
        )}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {paymentMethod === "qr"
          ? "Chuyển khoản an toàn và tiện lợi qua mã VietQR 24/7."
          : paymentMethod === "pay_at_venue"
          ? "Vé điện tử sẽ được gửi vào email của bạn ngay sau khi đặt."
          : "Vui lòng chọn phương thức thanh toán trước khi xác nhận đặt chỗ."}
      </p>
    </div>
  );
};

export default BookingCard;
