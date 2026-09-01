import api from "@/lib/axios";
import type {
  CreatePaymentResponse,
  GetPaymentResponse,
  Payment,
} from "@/types/payment";

export const paymentService = {
  createOrGetPayment: async (
    bookingId: string
  ): Promise<CreatePaymentResponse> => {
    const response = await api.post<CreatePaymentResponse>(
      "/payments/create",
      { bookingId }
    );
    return response.data;
  },

  getPaymentById: async (id: string): Promise<GetPaymentResponse> => {
    const response = await api.get<GetPaymentResponse>(`/payments/${id}`);
    return response.data;
  },

  getPaymentByBookingId: async (
    bookingId: string
  ): Promise<GetPaymentResponse> => {
    const response = await api.get<GetPaymentResponse>(
      `/payments/booking/${bookingId}`
    );
    return response.data;
  },

  cancelPayment: async (
    id: string
  ): Promise<{ message: string; payment: Payment }> => {
    const response = await api.post<{ message: string; payment: Payment }>(
      `/payments/${id}/cancel`
    );
    return response.data;
  },

  simulateSuccess: async (
    paymentId: string
  ): Promise<{ message: string; payment: Payment }> => {
    const response = await api.post<{ message: string; payment: Payment }>(
      "/payments/simulate-success",
      { paymentId }
    );
    return response.data;
  },
};

export default paymentService;
