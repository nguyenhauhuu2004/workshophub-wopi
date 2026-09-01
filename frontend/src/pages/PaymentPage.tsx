import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  QrCode,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import type { Payment } from "@/types/payment";
import type { Booking } from "@/types/booking";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Khởi tạo hoặc lấy Payment cho bookingId
  useEffect(() => {
    if (!bookingId) {
      setError("Không tìm thấy mã đặt chỗ");
      setLoading(false);
      return;
    }

    let active = true;

    const initPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await paymentService.createOrGetPayment(bookingId);

        if (!active) return;

        if (data.alreadyPaid) {
          toast.success("Đơn này đã thanh toán thành công!");
          navigate("/my-bookings");
          return;
        }

        setPayment(data.payment);
        if (data.booking) {
          setBooking(data.booking);
        }
      } catch (err: any) {
        console.error("Payment init error:", err);
        if (active) {
          setError(
            err.response?.data?.message || "Không thể khởi tạo thanh toán"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initPayment();

    return () => {
      active = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [bookingId, navigate]);

  // 2. Countdown Timer
  useEffect(() => {
    if (!payment || payment.status !== "pending") return;

    const calculateRemaining = () => {
      const expiry = new Date(payment.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff <= 0 && payment.status === "pending") {
        setPayment((prev) => (prev ? { ...prev, status: "expired" } : null));
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  // 3. Polling kiểm tra trạng thái thanh toán (mỗi 3 giây)
  useEffect(() => {
    if (!payment || payment.status !== "pending" || timeLeft <= 0) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await paymentService.getPaymentById(payment._id);
        if (res.payment && res.payment.status !== "pending") {
          setPayment(res.payment);
          if (res.booking) setBooking(res.booking);

          if (res.payment.status === "paid") {
            toast.success("Thanh toán thành công!");
          }
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (pollErr) {
        console.warn("Polling payment status error:", pollErr);
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [payment, timeLeft]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  // Hủy thanh toán
  const handleCancel = async () => {
    if (!payment) return;
    const confirmCancel = window.confirm(
      "Bạn có chắc muốn hủy đơn thanh toán này? Chỗ đã giữ sẽ được giải phóng."
    );
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      await paymentService.cancelPayment(payment._id);
      toast.info("Đã hủy thanh toán");
      navigate("/my-bookings");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy thanh toán");
    } finally {
      setCancelling(false);
    }
  };

  // Giả lập thanh toán thành công (Dev Test)
  const handleSimulate = async () => {
    if (!payment) return;
    try {
      setSimulating(true);
      const res = await paymentService.simulateSuccess(payment._id);
      setPayment(res.payment);
      toast.success("Đã giả lập thanh toán thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể giả lập thanh toán");
    } finally {
      setSimulating(false);
    }
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Đang tạo mã thanh toán VietQR...
        </p>
      </main>
    );
  }

  if (error || !payment) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle className="size-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Không thể thanh toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => navigate("/my-bookings")}>
          Xem đơn đặt chỗ của tôi
        </Button>
      </main>
    );
  }

  // Màn hình khi thanh toán thành công
  if (payment.status === "paid") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
        <div className="overflow-hidden rounded-3xl border bg-card p-8 shadow-card sm:p-10">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-12" />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">
            Thanh toán thành công!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Đơn đặt chỗ của bạn đã được xác nhận. Chúng tôi đã gửi vé check-in
            vào tài khoản của bạn.
          </p>

          <div className="mt-8 rounded-2xl bg-muted/60 p-5 text-left text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã thanh toán</span>
              <span className="font-mono font-bold">{payment.paymentCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-bold text-primary">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thời gian thanh toán</span>
              <span className="font-medium">
                {new Date(payment.paidAt || Date.now()).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="h-12 rounded-xl text-base font-semibold"
              onClick={() => navigate("/my-bookings")}
            >
              Xem vé đặt chỗ ngay
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl text-base font-semibold"
              onClick={() => navigate("/workshops")}
            >
              Khám phá thêm workshop
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Màn hình khi payment hết hạn hoặc bị hủy
  if (payment.status === "expired" || payment.status === "cancelled") {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="rounded-3xl border bg-card p-8 shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="size-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">
            {payment.status === "expired"
              ? "Mã thanh toán đã hết hạn"
              : "Thanh toán đã bị hủy"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {payment.status === "expired"
              ? "Thời gian thanh toán 15 phút đã kết thúc. Vị trí đã được giải phóng."
              : "Đơn thanh toán này đã được hủy theo yêu cầu của bạn."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => navigate("/workshops")}>
              Tìm workshop khác
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-bookings")}>
              Quay về Đơn đặt chỗ của tôi
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top bar back */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/my-bookings")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Quay lại Đơn đặt chỗ
        </button>

        <div className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-amber-700 shadow-sm">
          <Clock className="size-3.5 animate-pulse text-amber-600" />
          <span>Hết hạn sau: {formattedTime}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column: QR Code & Payment instructions */}
        <section className="space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Chuyển khoản ngân hàng 24/7
                </span>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Quét mã VietQR
                </h1>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <QrCode className="size-6" />
              </div>
            </div>

            {/* QR Image Box */}
            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-md transition hover:border-primary/50">
                <img
                  src={payment.qrDataURL}
                  alt="Mã VietQR"
                  className="size-64 object-contain sm:size-72"
                />
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sử dụng App ngân hàng bất kỳ (Vietcombank, MB, Techcombank, Momo...) để quét mã
              </p>
            </div>

            {/* Transfer details */}
            <div className="mt-8 space-y-3 border-t pt-6 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ngân hàng thụ hưởng</p>
                  <p className="font-semibold text-foreground">
                    {payment.bankAccount.bankName || "MBBank"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs text-muted-foreground">Số tài khoản</p>
                  <p className="font-mono text-base font-bold text-foreground">
                    {payment.bankAccount.accountNo}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 rounded-lg"
                  onClick={() =>
                    handleCopy(payment.bankAccount.accountNo, "Số tài khoản")
                  }
                >
                  <Copy className="size-3.5" />
                  Sao chép
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Chủ tài khoản</p>
                  <p className="font-semibold uppercase text-foreground">
                    {payment.bankAccount.accountName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Số tiền chính xác</p>
                  <p className="text-lg font-black text-primary">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 rounded-lg"
                  onClick={() =>
                    handleCopy(String(payment.amount), "Số tiền")
                  }
                >
                  <Copy className="size-3.5" />
                  Sao chép
                </Button>
              </div>

              {/* Unique Transfer Content */}
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                      Nội dung chuyển khoản
                    </p>
                    <span className="rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                      Bắt buộc
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-base font-black text-foreground">
                    {payment.paymentReference}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() =>
                    handleCopy(
                      payment.paymentReference,
                      "Nội dung chuyển khoản"
                    )
                  }
                >
                  <Copy className="size-3.5" />
                  Sao chép
                </Button>
              </div>
            </div>

            {/* Live polling indicator */}
            <div className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs font-medium text-primary">
              <Loader2 className="size-4 animate-spin shrink-0" />
              <span>Hệ thống đang tự động kiểm tra giao dịch chuyển khoản...</span>
            </div>

            {/* Note */}
            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>
                Vui lòng điền đúng <strong>chính xác nội dung chuyển khoản</strong> để hệ thống tự động xác nhận đơn trong vòng 10-30 giây.
              </span>
            </div>
          </div>
        </section>

        {/* Right column: Summary & actions */}
        <aside className="space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Thông tin đơn đặt chỗ</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Mã đơn</p>
                <p className="font-mono font-semibold">
                  {booking?.bookingCode || payment.paymentCode}
                </p>
              </div>

              {booking?.workshop && typeof booking.workshop !== "string" && (
                <div>
                  <p className="text-xs text-muted-foreground">Workshop</p>
                  <p className="font-semibold text-foreground">
                    {booking.workshop.title}
                  </p>
                </div>
              )}

              {booking?.sessionLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">Thời gian</p>
                  <p className="font-medium text-foreground">
                    {booking.sessionLabel}
                  </p>
                </div>
              )}

              {booking?.quantity && (
                <div>
                  <p className="text-xs text-muted-foreground">Số người tham gia</p>
                  <p className="font-medium text-foreground">
                    {booking.quantity} người
                  </p>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-primary">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Hủy thanh toán đơn này"
                )}
              </Button>
            </div>
          </div>

          {/* Dev Test Helper (Giả lập thanh toán) */}
          <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center text-xs">
            <p className="font-semibold text-muted-foreground">
              Công cụ thử nghiệm (Testing Tool)
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              Bạn có thể click nút bên dưới để giả lập webhook ngân hàng mà không cần chuyển khoản thật.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 w-full text-xs font-semibold"
              disabled={simulating}
              onClick={handleSimulate}
            >
              {simulating ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "⚡ Giả lập thanh toán thành công"
              )}
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
