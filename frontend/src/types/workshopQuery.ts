// types/workshopQuery.ts

import type { Workshop } from "@/types/workshop";

export type WorkshopSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "upcoming"
  | "distance_asc";

export type WorkshopListItem = Workshop & {
  distanceMeters?: number;
};

export type WorkshopSearchParams = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  district?: string;
  ward?: string;
  lat?: number;
  lng?: number;
  radius?: number;

  sort?: WorkshopSort | "upcoming";
  page?: number;
  limit?: number;
};

export type GetWorkshopsResponse = {
  workshops: WorkshopListItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  searchCenter?: {
    longitude: number;
    latitude: number;
    distance: number;
  };
};
