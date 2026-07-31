// types/workshopQuery.ts

import type { Workshop } from "@/types/workshop";

export type WorkshopSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "distance_asc";

export type WorkshopListItem = Workshop & {
  distanceMeters?: number;
};

export type WorkshopSearchParams = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  area?: string;
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;

  longitude?: number;
  latitude?: number;
  distance?: number;

  sort?: WorkshopSort;
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
