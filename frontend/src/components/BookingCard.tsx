"use client";

import { useMemo, useState } from "react";

export type BookingSession = {
  id: string | number;
  date: string;
  time: string;
  remaining: number;
};

export type BookingData = {
  session: BookingSession;
  quantity: number;
  pricePerPerson: number;
  subtotal: number;
  tax: number;
  total: number;
};

type BookingCardProps = {
  pricePerPerson: number;
  sessions: BookingSession[];
  taxRate?: number;
  location: string;
  currency?: string;
  locale?: string;
  className?: string;
  onBook?: (booking: BookingData) => void;
};

export default function BookingCard({
  pricePerPerson,
  sessions,
  taxRate = 0.08,
  location,
  currency = "VND",
  locale = "vi-VN",
  className = "",
  onBook,
}: BookingCardProps) {
  const availableSessions = useMemo(
    () => sessions.filter((session) => session.remaining > 0),
    [sessions],
  );

  const dates = useMemo(
    () => [...new Set(sessions.map((session) => session.date))],
    [sessions],
  );

  const defaultSession = availableSessions[0] ?? sessions[0];

  const [selectedDate, setSelectedDate] = useState(
    defaultSession?.date ?? "",
  );

  const [selectedSessionId, setSelectedSessionId] = useState<
    string | number | null
  >(defaultSession?.id ?? null);

  const [quantity, setQuantity] = useState(defaultSession ? 1 : 0);

  const sessionsByDate = useMemo(
    () => sessions.filter((session) => session.date === selectedDate),
    [sessions, selectedDate],
  );

  const selectedSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const subtotal = pricePerPerson * quantity;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "VND" ? 0 : 2,
      }),
    [currency, locale],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    [locale],
  );

  const formatDate = (date: string) => {
    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return dateFormatter.format(parsedDate);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);

    const firstAvailableSession = sessions.find(
      (session) => session.date === date && session.remaining > 0,
    );

    const firstSession = firstAvailableSession
      ?? sessions.find((session) => session.date === date);

    setSelectedSessionId(firstSession?.id ?? null);
    setQuantity(firstAvailableSession ? 1 : 0);
  };

  const handleSelectSession = (session: BookingSession) => {
    if (session.remaining <= 0) return;

    setSelectedSessionId(session.id);
    setQuantity((currentQuantity) =>
      Math.min(Math.max(currentQuantity, 1), session.remaining),
    );
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    if (!selectedSession) return;

    setQuantity((currentQuantity) =>
      Math.min(selectedSession.remaining, currentQuantity + 1),
    );
  };

  const handleBook = () => {
    if (!selectedSession || quantity < 1) return;

    onBook?.({
      session: selectedSession,
      quantity,
      pricePerPerson,
      subtotal,
      tax,
      total,
    });
  };

  const canBook =
    selectedSession !== null
    && selectedSession.remaining > 0
    && quantity > 0;

  return (
    <aside
      className={[
        "w-full rounded-3xl border border-neutral-200 bg-white p-5",
        "shadow-sm sm:p-6",
        className,
      ].join(" ")}
    >
      <div className="border-b border-neutral-200 pb-5">
        <p className="text-sm text-neutral-500">Giá tiền cho mỗi người</p>

        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-neutral-950">
            {moneyFormatter.format(pricePerPerson)}
          </span>

          <span className="pb-1 text-sm text-neutral-500">/ người</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-neutral-950">
          Chọn ngày
        </h3>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => handleSelectDate(date)}
                className={[
                  "shrink-0 rounded-xl border px-4 py-3 text-sm font-medium",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                ].join(" ")}
              >
                {formatDate(date)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-neutral-950">
          Chọn khung giờ
        </h3>

        <div className="mt-3 grid gap-2">
          {sessionsByDate.map((session) => {
            const isSelected = selectedSessionId === session.id;
            const isSoldOut = session.remaining <= 0;

            return (
              <button
                key={session.id}
                type="button"
                disabled={isSoldOut}
                onClick={() => handleSelectSession(session)}
                className={[
                  "flex items-center justify-between rounded-xl border",
                  "px-4 py-3 text-left",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-neutral-950 bg-neutral-50"
                    : "border-neutral-200",
                  isSoldOut
                    ? "cursor-not-allowed bg-neutral-50 opacity-50"
                    : "hover:border-neutral-400",
                ].join(" ")}
              >
                <span className="font-medium text-neutral-950">
                  {session.time}
                </span>

                <span
                  className={[
                    "text-sm",
                    isSoldOut
                      ? "text-red-500"
                      : session.remaining <= 3
                        ? "text-orange-600"
                        : "text-neutral-500",
                  ].join(" ")}
                >
                  {isSoldOut
                    ? "Hết chỗ"
                    : `Còn ${session.remaining} chỗ`}
                </span>
              </button>
            );
          })}

          {!sessionsByDate.length && (
            <div className="rounded-xl bg-neutral-50 px-4 py-5 text-center text-sm text-neutral-500">
              Không có khung giờ cho ngày này.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">
            Số lượng người
          </h3>

          {selectedSession && (
            <p className="mt-1 text-xs text-neutral-500">
              Tối đa {selectedSession.remaining} người
            </p>
          )}
        </div>

        <div className="flex items-center rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={!canBook || quantity <= 1}
            aria-label="Giảm số lượng"
            className="grid h-11 w-11 place-items-center text-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>

          <span className="min-w-10 text-center font-semibold text-neutral-950">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={
              !canBook
              || !selectedSession
              || quantity >= selectedSession.remaining
            }
            aria-label="Tăng số lượng"
            className="grid h-11 w-11 place-items-center text-xl disabled:cursor-not-allowed disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            {moneyFormatter.format(pricePerPerson)} × {quantity} người
          </span>

          <span className="font-medium text-neutral-950">
            {moneyFormatter.format(subtotal)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Thuế ({Math.round(taxRate * 100)}%)
          </span>

          <span className="font-medium text-neutral-950">
            {moneyFormatter.format(tax)}
          </span>
        </div>

        <div className="my-4 border-t border-neutral-200" />

        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-950">Tổng tiền</span>

          <span className="text-xl font-semibold text-neutral-950">
            {moneyFormatter.format(total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={!canBook}
        onClick={handleBook}
        className={[
          "mt-5 w-full rounded-xl bg-neutral-950 px-5 py-3.5",
          "font-semibold text-white",
          "hover:bg-neutral-800",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:bg-neutral-300",
        ].join(" ")}
      >
        Book now
      </button>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Location
        </p>

        <div className="mt-2 flex items-start gap-3">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-current text-neutral-700"
          >
            <path
              d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
          </svg>

          <p className="text-sm leading-6 text-neutral-700">{location}</p>
        </div>
      </div>
    </aside>
  );
}