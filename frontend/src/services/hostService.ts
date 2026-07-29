import api from "@/lib/axios";
import type {
  CheckInResult,
  HostBookingRow,
  HostDashboardSummary,
  HostWorkshopRow,
  PromotionCampaign,
  PromotionPackage,
  RevenueTransaction,
} from "@/types/host";

type DateRangeParams = {
  from?: string;
  to?: string;
};

export const hostService = {
  getDashboard: async (params: DateRangeParams = {}) => {
    const { data } = await api.get<HostDashboardSummary>("/host/dashboard", {
      params,
    });

    return data;
  },

  getWorkshops: async (params?: { status?: string; search?: string }) => {
    const { data } = await api.get<{
      workshops: HostWorkshopRow[];
    }>("/host/workshops", { params });

    return data.workshops;
  },

  getBookings: async (params?: {
    workshopId?: string;
    status?: string;
    search?: string;
  }) => {
    const { data } = await api.get<{
      bookings: HostBookingRow[];
    }>("/host/bookings", { params });

    return data.bookings;
  },

  checkIn: async (ticketCode: string) => {
    const { data } = await api.post<CheckInResult>("/host/check-in", {
      ticketCode,
    });

    return data;
  },

  getRevenueTransactions: async (params: DateRangeParams = {}) => {
    const { data } = await api.get<{
      transactions: RevenueTransaction[];
    }>("/host/revenue", { params });

    return data.transactions;
  },

  getPromotionPackages: async () => {
    const { data } = await api.get<{
      packages: PromotionPackage[];
    }>("/host/promotions/packages");

    return data.packages;
  },

  getPromotionCampaigns: async () => {
    const { data } = await api.get<{
      campaigns: PromotionCampaign[];
    }>("/host/promotions");

    return data.campaigns;
  },

  createPromotionCampaign: async (payload: {
    workshopId: string;
    packageCode: string;
    startAt: string;
  }) => {
    const { data } = await api.post<{
      campaign: PromotionCampaign;
      checkoutUrl?: string;
      message: string;
    }>("/host/promotions", payload);

    return data;
  },
};
