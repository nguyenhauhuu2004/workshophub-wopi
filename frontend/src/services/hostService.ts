import api from "@/lib/axios";

import type {
  CreateDiscountData,
  DiscountRow,
} from "@/types/discount";

import type {
  CreatePromotionCampaignData,
  CreatePromotionCampaignResponse,
  HostBookingRow,
  HostDashboardSummary,
  HostWorkshopRow,
  PromotionCampaign,
  PromotionPackage,
} from "@/types/host";

export const hostService = {
  getDashboard: async (): Promise<HostDashboardSummary> => {
    const response = await api.get<{
      summary: HostDashboardSummary;
    }>("/host/dashboard");

    return response.data.summary;
  },

  getWorkshops: async (): Promise<HostWorkshopRow[]> => {
    const response = await api.get<{
      workshops: HostWorkshopRow[];
    }>("/host/workshops");

    return response.data.workshops;
  },

  getBookings: async (): Promise<HostBookingRow[]> => {
    const response = await api.get<{
      bookings: HostBookingRow[];
    }>("/host/bookings");

    return response.data.bookings;
  },
  getPromotionPackages: async (): Promise<PromotionPackage[]> => {
    const response = await api.get<{
      packages: PromotionPackage[];
    }>("/promotions/packages");

    return response.data.packages;
  },

  getPromotionCampaigns: async (): Promise<PromotionCampaign[]> => {
    const response = await api.get<{
      campaigns: PromotionCampaign[];
    }>("/promotions/campaigns");

    return response.data.campaigns;
  },

  createPromotionCampaign: async (
    data: CreatePromotionCampaignData,
  ): Promise<CreatePromotionCampaignResponse> => {
    const response = await api.post<CreatePromotionCampaignResponse>(
      "/promotions/campaigns",
      data,
    );

    return response.data;
  },

  getDiscounts: async (): Promise<DiscountRow[]> => {
    const response = await api.get<{
      discounts: DiscountRow[];
    }>("/discounts");

    return response.data.discounts;
  },

  createDiscount: async (
    data: CreateDiscountData,
  ): Promise<{ message: string; discount: DiscountRow }> => {
    const response = await api.post<{
      message: string;
      discount: DiscountRow;
    }>("/discounts", data);

    return response.data;
  },

  toggleDiscount: async (
    discountId: string,
  ): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(
      `/discounts/${discountId}/toggle`,
    );

    return response.data;
  },

  deleteDiscount: async (
    discountId: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/discounts/${discountId}`,
    );

    return response.data;
  },
};

export default hostService;
