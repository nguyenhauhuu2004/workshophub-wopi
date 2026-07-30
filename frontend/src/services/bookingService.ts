import api from "@/lib/axios";

import type {
  BookingListResponse,
  CheckInBookingData,
  CheckInBookingResponse,
  CreateBookingData,
  CreateBookingResponse,
} from "@/types/booking";

export type GetMyBookingsParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export const bookingService = {
  createBooking: async (
    data: CreateBookingData,
  ): Promise<CreateBookingResponse> => {
    const response = await api.post<CreateBookingResponse>("/bookings", data);

    return response.data;
  },

  getMyBookings: async (
    params: GetMyBookingsParams = {},
  ): Promise<BookingListResponse> => {
    const response = await api.get<BookingListResponse>("/bookings/me", {
      params,
    });

    return response.data;
  },

  checkInBooking: async (
    data: CheckInBookingData,
  ): Promise<CheckInBookingResponse> => {
    const response = await api.post<CheckInBookingResponse>(
      "/bookings/check-in",
      data,
    );

    return response.data;
  },
};

export default bookingService;
