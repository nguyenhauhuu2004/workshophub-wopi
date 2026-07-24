import api from "@/lib/axios";

import type { WorkshopFormData, WorkshopMedia } from "@/types/workshop";

export type WorkshopPayload = Omit<
  WorkshopFormData,
  "price" | "seats" | "location"
> & {
  price: number;
  seatsTotal: number;

  location: {
    address: string;
    placeId: string;
    notes: string;

    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
  };
};
type NearbyParams = {
  longitude: number;
  latitude: number;
  distance?: number;
  excludeId?: string;
};
type CreateBookingPayload = {
  workshopId: string;
  sessionId: string;
  quantity: number;
};

export type WorkshopQuery = {
  search?: string;
  category?: string;
  maxPrice?: number;
  level?: string;
  address?: string;
  page?: number;
  limit?: number;
  sponsored?: boolean;
};

export type WorkshopListItem = {
  _id: string;
  title: string;
  category: string;
  description: string;

  price: number;
  level: string;
  duration: string;
  seatsTotal?: number;

  thumbnail?: WorkshopMedia;

  host?: {
    _id?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  location: {
    address: string;

    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
  };

  createdAt?: string;
  updatedAt?: string;
};

export type GetWorkshopsParams = {
  search?: string;
  category?: string;
  maxPrice?: number;
  level?: string;
  address?: string;
  page?: number;
  limit?: number;
};

export type GetWorkshopsResponse = {
  workshops: WorkshopListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export const workshopService = {
  getWorkshops: async (
    params: GetWorkshopsParams,
  ): Promise<GetWorkshopsResponse> => {
    const response = await api.get("/workshops", {
      params,
    });

    return response.data;
  },
  // getWorkshops: async (query: WorkshopQuery) => {
  //   const { data } = await api.get("/workshops", {
  //     params: query,
  //   });

  //   return data;
  // },
  getWorkshop: async (id: string) => {
    const { data } = await api.get(`/workshops/${id}`);

    return data.workshop;
  },

  getNearbyWorkshops: async ({
    longitude,
    latitude,
    distance = 10_000,
    excludeId,
  }: NearbyParams) => {
    const { data } = await api.get("/workshops/nearby", {
      params: {
        longitude,
        latitude,
        distance,
        excludeId,
      },
    });

    return data.workshops;
  },

  createBooking: async (payload: CreateBookingPayload) => {
    const { data } = await api.post("/bookings", payload);

    return data;
  },
  uploadMedia: async (files: File[]): Promise<WorkshopMedia[]> => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await api.post("/workshops/upload-media", formData);

    return data.media;
  },

  // createWorkshop: async (payload: WorkshopPayload) => {
  //   const { data } = await api.post("/workshops", payload);

  //   return data;
  // },
  createWorkshop: async (formData: FormData) => {
    const response = await api.post("/workshops", formData);

    return response.data;
  },

  updateWorkshop: async (id: string, payload: WorkshopPayload) => {
    const { data } = await api.patch(`/workshops/${id}`, payload);

    return data;
  },

  searchPlaces: async (input: string, location?: string) => {
    const { data } = await api.get("/workshops/goong/autocomplete", {
      params: {
        input,
        location,
      },
    });

    return data.predictions ?? [];
  },

  getPlaceDetail: async (placeId: string) => {
    const { data } = await api.get("/workshops/goong/place-detail", {
      params: {
        place_id: placeId,
      },
    });

    return data.result;
  },

  reverseGeocode: async (latitude: number, longitude: number) => {
    const { data } = await api.get("/workshops/goong/reverse-geocode", {
      params: {
        latlng: `${latitude},${longitude}`,
      },
    });

    return data.results?.[0];
  },
};
