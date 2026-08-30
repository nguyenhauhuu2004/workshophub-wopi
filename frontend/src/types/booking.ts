import type { Workshop, WorkshopSchedule } from "@/types/workshop";

export type CheckInBookingData = {
  qrContent?: string;
  bookingCode?: string;
  method?: "qr" | "manual";
};

export type CheckInBookingResponse = {
  message: string;
  booking: Booking;
  alreadyCheckedIn: boolean;
};

export type BookingPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show"
  | "refunded";

export type BookingPayoutStatus = "pending" | "available" | "paid" | "held";

export type BookingCheckInMethod = "qr" | "manual";

export type BookingSessionSnapshot = {
  startAt: string;
  seatsTotal: number;
};

export type BookingUserSummary = {
  _id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
};

export type BookingWorkshopSummary = Pick<
  Workshop,
  | "_id"
  | "title"
  | "thumbnail"
  | "categories"
  | "location"
  | "price"
  | "duration"
>;

export type Booking = {
  _id: string;
  bookingCode: string;

  workshop: string | BookingWorkshopSummary;

  host: string | BookingUserSummary;

  user: string | BookingUserSummary;

  sessionId: string;
  sessionLabel: string;

  sessionSnapshot: BookingSessionSnapshot;

  attendeeName: string;
  attendeeEmail: string;

  quantity: number;

  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  grossAmount: number;
  refundAmount: number;
  platformFee: number;
  hostNetAmount: number;

  paymentStatus: BookingPaymentStatus;

  status: BookingStatus;

  paidAt: string | null;

  checkedInAt: string | null;

  checkedInBy: string | BookingUserSummary | null;

  checkInMethod: BookingCheckInMethod | null;

  payoutStatus: BookingPayoutStatus;

  payoutAt: string | null;

  promotionCampaign: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CreateBookingData = {
  workshopId: string;
  sessionId: string;
  quantity: number;
};

export type CreateBookingResponse = {
  message: string;
  booking: Booking;
};

export type BookingListResponse = {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
};

export type BookingSession = Pick<
  WorkshopSchedule,
  "startAt" | "seatsTotal" | "spotsLeft"
> & {
  id: string;
};

export type BookingCardData = {
  session: BookingSession;
  quantity: number;
};
