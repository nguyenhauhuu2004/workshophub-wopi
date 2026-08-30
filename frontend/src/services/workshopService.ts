import api from "@/lib/axios";
// import type {
//   GoongGeocodeResult,
//   GoongPlaceDetail,
//   GoongPlacePrediction,
// } from "@/types/goong";

import type {
  GoongPlacePrediction,
  GoongPlaceResult,
  Workshop,
  WorkshopFormData,
  WorkshopLocation,
  WorkshopSchedule,
  WorkshopStatus,
  UpdateWorkshopPayload,
  CreateWorkshopSchedulePayload,
} from "@/types/workshop";

import type {
  GetWorkshopsResponse,
  WorkshopSearchParams,
} from "@/types/workshopQuery";

export type GetWorkshopsParams = {
  search?: string;
  category?: string;
  maxPrice?: number;
  address?: string;
  page?: number;
  limit?: number;
};

export type GetNearbyWorkshopsParams = {
  longitude: number;
  latitude: number;
  distance?: number;
  excludeId?: string;
};

export type WorkshopListResponse = {
  workshops: Workshop[];
  total: number;
  page: number;
  totalPages: number;
};

export type WorkshopResponse = {
  message?: string;
  workshop: Workshop;
};

export type UpdateWorkshopData = {
  title?: string;
  categories?: string[];
  description?: string;
  highlights?: string[];
  includes?: string[];
  price?: string | number;
  duration?: string;
  schedules?: WorkshopSchedule[];
  location?: WorkshopLocation;
  status?: WorkshopStatus;
};

const buildWorkshopFormData = (data: WorkshopFormData): FormData => {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("categories", JSON.stringify(data.categories));
  formData.append("description", data.description);
  formData.append("highlights", JSON.stringify(data.highlights));
  formData.append("includes", JSON.stringify(data.includes));
  formData.append("price", data.price);
  formData.append("duration", data.duration);
  formData.append("schedules", JSON.stringify(data.schedules));
  formData.append("location", JSON.stringify(data.location));
  formData.append("status", data.status ?? "published");

  if (data.thumbnail) {
    formData.append("thumbnail", data.thumbnail);
  }

  data.gallery.forEach((file) => {
    formData.append("gallery", file);
  });

  if (data.video) {
    formData.append("video", data.video);
  }

  return formData;
};

export const workshopService = {
  updateWorkshop: async (
    workshopId: string,
    payload: UpdateWorkshopPayload,
  ): Promise<Workshop> => {
    const response = await api.patch(`/workshops/${workshopId}`, payload);

    return response.data.workshop;
  },

  addWorkshopSchedule: async (
    workshopId: string,
    payload: CreateWorkshopSchedulePayload,
  ): Promise<Workshop> => {
    const response = await api.post(
      `/workshops/${workshopId}/schedules`,
      payload,
    );

    return response.data.workshop;
  },
  // getWorkshops: async (
  //   params: GetWorkshopsParams = {},
  // ): Promise<WorkshopListResponse> => {
  //   const response = await api.get<WorkshopListResponse>("/workshops", {
  //     params,
  //   });

  //   return response.data;
  // },
  getWorkshops: async (
    params: WorkshopSearchParams = {},
    signal?: AbortSignal,
  ): Promise<GetWorkshopsResponse> => {
    const response = await api.get("/workshops", {
      params,
      signal,
    });

    return response.data;
  },
  getWorkshopById: async (workshopId: string): Promise<Workshop> => {
    const response = await api.get<WorkshopResponse>(
      `/workshops/${workshopId}`,
    );

    return response.data.workshop;
  },

  getNearbyWorkshops: async (
    params: GetNearbyWorkshopsParams,
  ): Promise<Workshop[]> => {
    const response = await api.get<{
      workshops: Workshop[];
    }>("/workshops/nearby", {
      params,
    });

    return response.data.workshops;
  },

  createWorkshop: async (data: WorkshopFormData): Promise<Workshop> => {
    const formData = buildWorkshopFormData(data);

    const response = await api.post<WorkshopResponse>("/workshops", formData);

    return response.data.workshop;
  },

  // updateWorkshop: async (
  //   workshopId: string,
  //   data: UpdateWorkshopData,
  // ): Promise<Workshop> => {
  //   const response = await api.patch<WorkshopResponse>(
  //     `/workshops/${workshopId}`,
  //     data,
  //   );

  //   return response.data.workshop;
  // },
  searchPlaces: async (
    input: string,
    location?: string,
  ): Promise<GoongPlacePrediction[]> => {
    const response = await api.get<{
      predictions: GoongPlacePrediction[];
    }>("/workshops/goong/autocomplete", {
      params: {
        input,
        location,
      },
    });

    return response.data.predictions ?? [];
  },

  getPlaceDetail: async (placeId: string): Promise<GoongPlaceResult | null> => {
    const response = await api.get<{
      result: GoongPlaceResult;
    }>("/workshops/goong/place-detail", {
      params: {
        place_id: placeId,
      },
    });

    return response.data.result ?? null;
  },

  reverseGeocode: async (
    latitude: number,
    longitude: number,
  ): Promise<GoongPlaceResult | null> => {
    const response = await api.get<{
      results: GoongPlaceResult[];
    }>("/workshops/goong/reverse-geocode", {
      params: {
        latlng: `${latitude},${longitude}`,
      },
    });

    return response.data.results?.[0] ?? null;
  },
};

export default workshopService;
