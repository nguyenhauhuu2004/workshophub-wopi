import { Banknote, QrCode } from "lucide-react";
import type { BookingPaymentMethod } from "@/types/booking";

type PaymentMethodSelectorProps = {
  value: BookingPaymentMethod;
  onChange: (method: BookingPaymentMethod) => void;
  disabled?: boolean;
};

type PaymentMethodItem = {
  value: BookingPaymentMethod;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
};

const METHODS: PaymentMethodItem[] = [
  {
    value: "pay_at_venue",
    icon: <Banknote className="size-5" />,
    title: "Thanh toán tại workshop",
    description: "Trả tiền mặt khi đến nơi — nhận vé điện tử ngay sau khi đặt",
    badge: "Khuyên dùng",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "qr",
    icon: <QrCode className="size-5" />,
    title: "Chuyển khoản QR (VietQR)",
    description: "Chuyển khoản nhanh 24/7 qua mã VietQR — xác nhận tự động",
  },
];

const PaymentMethodSelector = ({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Phương thức thanh toán</p>

      {METHODS.map((method) => {
        const isSelected = value === method.value;
        const isItemDisabled = disabled || method.disabled;

        return (
          <button
            key={method.value}
            type="button"
            disabled={isItemDisabled}
            onClick={() => {
              if (!isItemDisabled) {
                onChange(method.value);
              }
            }}
            className={[
              "w-full rounded-2xl border p-4 text-left transition",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/40 hover:bg-muted/40",
              isItemDisabled
                ? "cursor-not-allowed opacity-55 bg-muted/30"
                : "cursor-pointer",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {method.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{method.title}</p>
                  {method.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        method.badgeColor ?? "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {method.description}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={[
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30",
                ].join(" ")}
              >
                {isSelected && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
