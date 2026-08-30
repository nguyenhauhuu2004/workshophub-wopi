export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n || 0);

export const tierStyle = {
  Bronze: "bg-amber-100 text-amber-800 border-amber-200",
  Silver: "bg-slate-100 text-slate-700 border-slate-300",
  Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Platinum: "bg-violet-100 text-violet-800 border-violet-200",
};

export const isPriority = (w: { priority_until?: string }) => w?.priority_until && new Date(w.priority_until) > new Date();

export const isHot = (w: { bookings_7d?: number }) => (w?.bookings_7d || 0) >= 25;

export const seatsLeft = (w: { capacity?: number; booked?: number }) => Math.max(0, (w?.capacity || 0) - (w?.booked || 0));

export const COMMISSION_RATE = 0.1;
