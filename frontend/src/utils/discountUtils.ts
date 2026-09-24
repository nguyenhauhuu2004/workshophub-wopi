export type WorkshopPriceInfo = {
  hasDiscount: boolean;
  originalPrice: number;
  finalPrice: number;
  discountBadge: string | null;
  discountPercent: number;
  discountAmount: number;
};

/**
 * Tính toán giá gốc, giá sau giảm và huy hiệu giảm giá trực tiếp của workshop
 */
export const getWorkshopPriceInfo = (workshop?: {
  price?: number;
  directDiscount?: {
    type: "percentage" | "fixed";
    value: number;
    isActive: boolean;
    expiresAt?: string | null;
  } | null;
}): WorkshopPriceInfo => {
  const originalPrice = Number(workshop?.price) || 0;

  if (workshop?.directDiscount && workshop.directDiscount.isActive) {
    const { type, value, expiresAt } = workshop.directDiscount;
    const isExpired = expiresAt
      ? new Date(expiresAt).getTime() <= Date.now()
      : false;

    if (!isExpired && value > 0) {
      let finalPrice = originalPrice;
      let discountAmount = 0;
      let discountBadge = "";

      if (type === "percentage") {
        discountAmount = Math.round((originalPrice * value) / 100);
        finalPrice = Math.max(0, originalPrice - discountAmount);
        discountBadge = `-${value}%`;
      } else {
        discountAmount = Math.min(value, originalPrice);
        finalPrice = Math.max(0, originalPrice - discountAmount);
        discountBadge = `-${new Intl.NumberFormat("vi-VN").format(value)}đ`;
      }

      const discountPercent =
        originalPrice > 0
          ? Math.round((discountAmount / originalPrice) * 100)
          : 0;

      return {
        hasDiscount: true,
        originalPrice,
        finalPrice,
        discountBadge,
        discountPercent,
        discountAmount,
      };
    }
  }

  return {
    hasDiscount: false,
    originalPrice,
    finalPrice: originalPrice,
    discountBadge: null,
    discountPercent: 0,
    discountAmount: 0,
  };
};
