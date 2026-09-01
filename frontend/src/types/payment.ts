import type { Booking } from "@/types/booking";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";

export type BankAccountInfo = {
  bankBin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
};

export type Payment = {
  _id: string;
  paymentCode: string;
  booking: string | Booking;
  user: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: "vietqr";
  paymentReference: string;
  bankAccount: BankAccountInfo;
  qrCode: string;
  qrDataURL: string;
  deeplink?: string;
  expiresAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentResponse = {
  message: string;
  payment: Payment;
  booking?: Booking;
  alreadyPaid?: boolean;
};

export type GetPaymentResponse = {
  payment: Payment;
  booking?: Booking;
};
