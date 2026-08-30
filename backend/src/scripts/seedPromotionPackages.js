import "dotenv/config";
import mongoose from "mongoose";

import PromotionPackage from "../models/PromotionPackage.js";

const packages = [
  {
    code: "HOME_3_DAYS",
    name: "Nổi bật trang chủ",
    description: "Workshop xuất hiện tại khu vực nổi bật trên trang chủ.",
    price: 99000,
    durationDays: 3,
    placement: "homepage",
    sortOrder: 1,
  },

  {
    code: "SEARCH_7_DAYS",
    name: "Top tìm kiếm",
    description: "Workshop được ưu tiên tại kết quả tìm kiếm.",
    price: 199000,
    durationDays: 7,
    placement: "search_top",
    sortOrder: 2,
  },

  {
    code: "CATEGORY_14_DAYS",
    name: "Top danh mục",
    description: "Workshop được ưu tiên trong các danh mục đã chọn.",
    price: 349000,
    durationDays: 14,
    placement: "category_top",
    sortOrder: 3,
  },
];

try {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const item of packages) {
    await PromotionPackage.findOneAndUpdate(
      {
        code: item.code,
      },
      {
        $set: {
          ...item,
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  console.log("Seed promotion packages thành công");
} catch (error) {
  console.error("Seed promotion packages error:", error);

  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
