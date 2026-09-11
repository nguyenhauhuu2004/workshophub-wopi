import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import BookingCard, { type FullBookingData } from "@/components/BookingCard";
import type { BookingSession } from "@/types/booking";

type MobileBookingDrawerProps = {
  pricePerPerson: number;
  sessions: BookingSession[];
  location: string;
  defaultAttendee?: { name: string; email: string; phone: string };
  disabled?: boolean;
  onBook: (data: FullBookingData) => Promise<void> | void;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function MobileBookingDrawer({
  pricePerPerson,
  sessions,
  location,
  defaultAttendee,
  disabled = false,
  onBook,
}: MobileBookingDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Khóa cuộn trang khi drawer mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBookAndClose = async (data: FullBookingData) => {
    try {
      await onBook(data);
      setIsOpen(false);
    } catch {
      // Giữ drawer mở nếu có lỗi để người dùng sửa thông tin
    }
  };

  return (
    <>
      {/* 1. Thanh bar nổi cố định ở dưới màn hình mobile (giống header nhưng ở bottom) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Giá mỗi người</p>
            <p className="truncate text-xl font-bold text-primary">
              {formatCurrency(pricePerPerson)}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            className="h-12 rounded-2xl px-6 text-base font-semibold shadow-md transition active:scale-95"
          >
            <CalendarCheck className="mr-2 size-5" />
            Đặt chỗ ngay
          </Button>
        </div>
      </div>

      {/* 2. Pushup Drawer / Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop làm mờ nền */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Khung Drawer trượt từ dưới lên (push up) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-[28px] border-t border-border bg-background shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              {/* Handle kéo ở đỉnh drawer */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Tiêu đề & Nút đóng */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
                <div>
                  <h3 className="text-lg font-bold">Đặt chỗ workshop</h3>
                  <p className="text-xs text-muted-foreground">
                    Chọn lịch & điền thông tin người tham gia
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground active:scale-95"
                  aria-label="Đóng"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Nội dung form đặt chỗ có thể cuộn */}
              <div className="overflow-y-auto px-4 py-4 sm:px-6">
                <BookingCard
                  pricePerPerson={pricePerPerson}
                  sessions={sessions}
                  location={location}
                  defaultAttendee={defaultAttendee}
                  taxRate={0.08}
                  disabled={disabled}
                  onBook={handleBookAndClose}
                  className="border-0 bg-transparent p-0 shadow-none sm:p-0"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
