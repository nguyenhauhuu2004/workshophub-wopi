export type DiscountType = "percentage" | "fixed";
export type DiscountApplyType = "code" | "direct";

export type DiscountRow = {
  _id: string;
  workshopId: string;
  workshopTitle: string;
  applyType?: DiscountApplyType;
  code: string;
  type: DiscountType;
  value: number;
  maxUsage: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type CreateDiscountData = {
  workshopId: string;
  applyType?: DiscountApplyType;
  code?: string;
  type: DiscountType;
  value: number;
  maxUsage?: number | null;
  expiresAt?: string | null;
};
