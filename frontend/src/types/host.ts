import type { BookingPaymentStatus, BookingStatus } from "@/types/booking";

import type { WorkshopMedia, WorkshopStatus } from "@/types/workshop";

export type HostRevenueSeriesItem = {
  label: string;
  gross: number;
  net: number;
};

export type HostDashboardSummary = {
  revenue: {
    gross: number;
    platformFee: number;
    net: number;
    pendingPayout: number;
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

  revenueSeries: HostRevenueSeriesItem[];
};

export type HostWorkshopSession = {
  _id: string;
  startAt: string;
  seatsTotal: number;
  spotsLeft: number;
};

export type HostWorkshopRow = {
  _id: string;
  title: string;
  categories: string[];
  thumbnail: WorkshopMedia | null;

  status: WorkshopStatus;

  nextSession: HostWorkshopSession | null;

  occupancyRate: number;
  totalBookings: number;
  totalRevenue: number;
};

export type HostBookingRow = {
  _id: string;
  bookingCode: string;

  attendeeName: string;
  attendeeEmail: string;

  workshopTitle: string;
  sessionLabel: string;

  quantity: number;
  grossAmount: number;

  paymentStatus: BookingPaymentStatus;

  status: BookingStatus;

  createdAt: string;
  checkedInAt: string | null;
};

export type PromotionPlacement = "homepage" | "search_top" | "category_top";

export type PromotionCampaignStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled";

export type PromotionPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PromotionPackage = {
  _id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  placement: PromotionPlacement;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PromotionCampaign = {
  _id: string;

  workshopId: string;
  workshopTitle: string;

  packageCode: string;
  packageName: string;

  placement: PromotionPlacement;

  price: number;
  durationDays: number;

  startAt: string;
  endAt: string;

  status: PromotionCampaignStatus;

  paymentStatus: PromotionPaymentStatus;

  impressions: number;
  clicks: number;
  attributedBookings: number;

  createdAt: string;
};

export type CreatePromotionCampaignData = {
  workshopId: string;
  packageCode: string;
  startAt: string;
};

export type CreatePromotionCampaignResponse = {
  message: string;
  campaign: PromotionCampaign;
};
