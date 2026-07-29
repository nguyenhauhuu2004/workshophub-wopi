export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export type WorkshopStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "completed"
  | "cancelled";

export type HostDashboardSummary = {
  revenue: {
    gross: number;
    discounts: number;
    refunds: number;
    platformFee: number;
    net: number;
    pendingPayout: number;
    paidOut: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    checkedIn: number;
    cancelled: number;
    noShow: number;
  };
  workshops: {
    total: number;
    published: number;
    draft: number;
    upcomingSessions: number;
    emptySessions: number;
    lowFillSessions: number;
  };
  promotion: {
    activeCampaigns: number;
    impressions: number;
    clicks: number;
    attributedBookings: number;
    spend: number;
  };
  revenueSeries: Array<{
    label: string;
    gross: number;
    net: number;
  }>;
};

export type HostWorkshopRow = {
  _id: string;
  title: string;
  category: string;
  status: WorkshopStatus;
  thumbnail?: {
    url: string;
  };
  nextSession?: {
    sessionId: string;
    startsAt: string;
    capacity: number;
    bookedCount: number;
  };
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
};

export type HostBookingRow = {
  _id: string;
  bookingCode: string;
  attendeeName: string;
  attendeeEmail: string;
  workshopId: string;
  workshopTitle: string;
  sessionId: string;
  sessionLabel: string;
  quantity: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  checkedInAt?: string;
  createdAt: string;
};

export type CheckInResult = {
  booking: HostBookingRow;
  message: string;
  alreadyCheckedIn?: boolean;
};

export type RevenueTransaction = {
  _id: string;
  bookingCode: string;
  workshopTitle: string;
  paidAt: string;
  gross: number;
  refund: number;
  platformFee: number;
  hostNet: number;
  payoutStatus: "pending" | "available" | "paid" | "held";
};

export type PromotionPackage = {
  code: string;
  name: string;
  price: number;
  durationDays: number;
  placement:
    | "homepage"
    | "search"
    | "category"
    | "location"
    | "homepage_search";
  description: string;
};

export type PromotionCampaign = {
  _id: string;
  workshopId: string;
  workshopTitle: string;
  packageCode: string;
  packageName: string;
  placement: string;
  startAt: string;
  endAt: string;
  price: number;
  status:
    | "pending_payment"
    | "scheduled"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected";
  impressions: number;
  clicks: number;
  attributedBookings: number;
};
