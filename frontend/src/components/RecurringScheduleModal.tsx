import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GeneratedSchedule = {
  startAt: string; // ISO string or YYYY-MM-DDTHH:mm
  seatsTotal: number;
};

interface RecurringScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (schedules: GeneratedSchedule[]) => void | Promise<void>;
  defaultSeats?: number;
  title?: string;
  isSubmitting?: boolean;
}

const DAYS_OF_WEEK = [
  { label: "Thứ 2", short: "T2", dayIndex: 1 },
  { label: "Thứ 3", short: "T3", dayIndex: 2 },
  { label: "Thứ 4", short: "T4", dayIndex: 3 },
  { label: "Thứ 5", short: "T5", dayIndex: 4 },
  { label: "Thứ 6", short: "T6", dayIndex: 5 },
  { label: "Thứ 7", short: "T7", dayIndex: 6, isWeekend: true },
  { label: "Chủ nhật", short: "CN", dayIndex: 0, isWeekend: true },
];

const getTodayDateString = () => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const addWeeksToDate = (baseDateStr: string, weeks: number) => {
  const date = new Date(baseDateStr);
  date.setDate(date.getDate() + weeks * 7);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

export default function RecurringScheduleModal({
  isOpen,
  onClose,
  onApply,
  defaultSeats = 12,
  title = "Thiết lập lịch lặp lại theo thứ",
  isSubmitting = false,
}: RecurringScheduleModalProps) {
  const today = getTodayDateString();

  // Selected days: 0 for Sunday, 1-6 for Mon-Sat. Default: Weekend [6, 0]
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]);

  // Times per day: array of strings "HH:mm"
  const [times, setTimes] = useState<string[]>(["09:00"]);

  // Date range
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(() => addWeeksToDate(today, 4));

  // Seats per session
  const [seatsTotal, setSeatsTotal] = useState<number>(defaultSeats);

  // Quick preset helpers
  const handleSelectAllDays = () => {
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
  };

  const handleSelectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleSelectWeekends = () => {
    setSelectedDays([6, 0]);
  };

  const handleClearDays = () => {
    setSelectedDays([]);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  };

  // Add/remove time slots
  const handleAddTimeSlot = () => {
    setTimes((prev) => [...prev, "14:00"]);
  };

  const handleUpdateTimeSlot = (index: number, newTime: string) => {
    setTimes((prev) => {
      const next = [...prev];
      next[index] = newTime;
      return next;
    });
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (times.length <= 1) return;
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick range buttons
  const handleSetWeeks = (weeks: number) => {
    setEndDate(addWeeksToDate(startDate || today, weeks));
  };

  // Generate schedules preview
  const generatedSchedules = useMemo<GeneratedSchedule[]>(() => {
    if (!startDate || !endDate || selectedDays.length === 0 || times.length === 0 || seatsTotal < 1) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const now = new Date();
    const result: GeneratedSchedule[] = [];
    const current = new Date(start);

    const validTimes = times.filter(Boolean);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        for (const timeStr of validTimes) {
          const [hStr, mStr] = timeStr.split(":");
          const hours = parseInt(hStr, 10);
          const minutes = parseInt(mStr, 10);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const sessionDate = new Date(current);
          sessionDate.setHours(hours, minutes, 0, 0);

          if (sessionDate.getTime() > now.getTime()) {
            const yyyy = sessionDate.getFullYear();
            const mm = String(sessionDate.getMonth() + 1).padStart(2, "0");
            const dd = String(sessionDate.getDate()).padStart(2, "0");
            const hh = String(hours).padStart(2, "0");
            const min = String(minutes).padStart(2, "0");

            result.push({
              startAt: `${yyyy}-${mm}-${dd}T${hh}:${min}`,
              seatsTotal,
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [startDate, endDate, selectedDays, times, seatsTotal]);

  const handleConfirm = async () => {
    if (generatedSchedules.length === 0 || isSubmitting) return;
    await onApply(generatedSchedules);
  };

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 px-6 py-4 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#315d43] text-white shadow-sm">
              <CalendarRange className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">{title}</h2>
              <p className="text-xs text-stone-500">
                Tự động sinh các buổi tổ chức theo các thứ trong tuần
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Day of Week Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-[#315d43]" />
                Chọn các thứ lặp lại (Có thể chọn nhiều hoặc tất cả)
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className={`rounded-md px-2 py-0.5 font-medium transition ${
                    selectedDays.length === 7
                      ? "bg-[#315d43] text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Tất cả
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={handleSelectWeekdays}
                  className="rounded-md px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-medium transition"
                >
                  T2 - T6
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={handleSelectWeekends}
                  className="rounded-md px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-medium transition"
                >
                  Cuối tuần (T7, CN)
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={handleClearDays}
                  className="rounded-md px-1.5 py-0.5 text-stone-400 hover:text-rose-600 font-medium transition"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.dayIndex);
                return (
                  <button
                    key={day.dayIndex}
                    type="button"
                    onClick={() => toggleDay(day.dayIndex)}
                    className={`group relative flex flex-col items-center justify-center rounded-2xl py-3 px-1 transition-all text-center border ${
                      isSelected
                        ? "border-[#315d43] bg-[#315d43] text-white shadow-sm scale-[1.02]"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-xs font-semibold">{day.short}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isSelected
                          ? "text-stone-200"
                          : day.isWeekend
                          ? "text-amber-600 font-medium"
                          : "text-stone-400"
                      }`}
                    >
                      {day.label}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-1 ring-white">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDays.length === 0 && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">
                Vui lòng chọn ít nhất một thứ trong tuần.
              </p>
            )}
          </div>

          {/* Time Slots & Seats */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Time Slots */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#315d43]" />
                  Khung giờ bắt đầu ({times.length} ca/ngày)
                </label>
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#315d43] hover:underline"
                >
                  <Plus className="size-3" />
                  Thêm ca
                </button>
              </div>

              <div className="space-y-2">
                {times.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleUpdateTimeSlot(idx, e.target.value)}
                      className="h-10 rounded-xl border-stone-200"
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(idx)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seats per session */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Users className="size-3.5 text-[#315d43]" />
                Số chỗ mỗi buổi
              </label>
              <Input
                type="number"
                min={1}
                value={seatsTotal}
                onChange={(e) => setSeatsTotal(Math.max(1, Number(e.target.value) || 1))}
                placeholder="12"
                className="h-10 rounded-xl border-stone-200"
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                Mỗi buổi được sinh ra sẽ tự động có {seatsTotal} chỗ trống ban đầu.
              </p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Khoảng thời gian áp dụng
              </label>

              {/* Quick range presets */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSetWeeks(2)}
                  className="rounded-md px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-medium transition"
                >
                  2 tuần
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSetWeeks(4)}
                  className="rounded-md px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-medium transition"
                >
                  4 tuần (1 tháng)
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSetWeeks(8)}
                  className="rounded-md px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-medium transition"
                >
                  8 tuần (2 tháng)
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] text-stone-500 mb-1">Từ ngày</span>
                <Input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl border-stone-200"
                />
              </div>
              <div>
                <span className="block text-[11px] text-stone-500 mb-1">Đến ngày</span>
                <Input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl border-stone-200"
                />
              </div>
            </div>
          </div>

          {/* Live Preview List */}
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Xem trước: Sẽ tạo{" "}
                  <span className="text-emerald-700 font-black text-sm">
                    {generatedSchedules.length} buổi tổ chức
                  </span>
                </p>
              </div>
            </div>

            {generatedSchedules.length > 0 ? (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {generatedSchedules.map((s, index) => {
                  const date = new Date(s.startAt);
                  const dayName = date.toLocaleDateString("vi-VN", {
                    weekday: "long",
                  });
                  const dateFormatted = date.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const timeFormatted = date.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-xs border border-stone-200/60 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-stone-400">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-stone-800 capitalize">
                          {dayName}
                        </span>
                        <span className="text-stone-500">{dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
                          {timeFormatted}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          {s.seatsTotal} chỗ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-stone-400">
                Chưa có buổi nào. Vui lòng chọn thứ và khoảng ngày trong tương lai.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200/80 px-6 py-4 bg-stone-50/70">
          <p className="text-xs text-stone-500">
            {generatedSchedules.length > 0 ? (
              <>
                Tổng cộng: <strong className="text-stone-800">{generatedSchedules.length}</strong> buổi ({selectedDays.length} thứ/tuần)
              </>
            ) : (
              "Chọn thông tin để tạo lịch"
            )}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-stone-300"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={generatedSchedules.length === 0 || isSubmitting}
              className="rounded-xl bg-[#315d43] hover:bg-[#284936] text-white"
            >
              Áp dụng {generatedSchedules.length > 0 ? `(${generatedSchedules.length} buổi)` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
