import { create } from "zustand";
import axios from "axios";

import type { Workshop, WorkshopFormData } from "@/types/workshop";

import {
  workshopService,
  type GetNearbyWorkshopsParams,
  type GetWorkshopsParams,
  type UpdateWorkshopData,
} from "@/services/workshopService";

type WorkshopStore = {
  workshops: Workshop[];
  nearbyWorkshops: Workshop[];
  currentWorkshop: Workshop | null;

  total: number;
  page: number;
  totalPages: number;

  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchWorkshops: (params?: GetWorkshopsParams) => Promise<void>;

  fetchWorkshopById: (workshopId: string) => Promise<Workshop>;

  fetchNearbyWorkshops: (params: GetNearbyWorkshopsParams) => Promise<void>;

  createWorkshop: (data: WorkshopFormData) => Promise<Workshop>;

  updateWorkshop: (
    workshopId: string,
    data: UpdateWorkshopData,
  ) => Promise<Workshop>;

  setCurrentWorkshop: (workshop: Workshop | null) => void;

  clearError: () => void;
  reset: () => void;
};

type ApiErrorData = {
  message?: string;
  error?: string;
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Không thể kết nối tới máy chủ"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định";
};

const initialState = {
  workshops: [] as Workshop[],
  nearbyWorkshops: [] as Workshop[],
  currentWorkshop: null as Workshop | null,

  total: 0,
  page: 1,
  totalPages: 0,

  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
};

export const useWorkshopStore = create<WorkshopStore>((set) => ({
  ...initialState,

  fetchWorkshops: async (params = {}) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const result = await workshopService.getWorkshops(params);

      set({
        workshops: result.workshops,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  fetchWorkshopById: async (workshopId) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const workshop = await workshopService.getWorkshopById(workshopId);

      set({
        currentWorkshop: workshop,
        isLoading: false,
      });

      return workshop;
    } catch (error) {
      set({
        currentWorkshop: null,
        isLoading: false,
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  fetchNearbyWorkshops: async (params) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const workshops = await workshopService.getNearbyWorkshops(params);

      set({
        nearbyWorkshops: workshops,
        isLoading: false,
      });
    } catch (error) {
      set({
        nearbyWorkshops: [],
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  createWorkshop: async (data) => {
    set({
      isSubmitting: true,
      error: null,
    });

    try {
      const workshop = await workshopService.createWorkshop(data);

      set((state) => ({
        workshops: [workshop, ...state.workshops],
        currentWorkshop: workshop,
        total: state.total + 1,
        isSubmitting: false,
      }));

      return workshop;
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  updateWorkshop: async (workshopId, data) => {
    set({
      isSubmitting: true,
      error: null,
    });

    try {
      const updatedWorkshop = await workshopService.updateWorkshop(
        workshopId,
        data,
      );

      set((state) => ({
        workshops: state.workshops.map((workshop) =>
          workshop._id === workshopId ? updatedWorkshop : workshop,
        ),

        nearbyWorkshops: state.nearbyWorkshops.map((workshop) =>
          workshop._id === workshopId ? updatedWorkshop : workshop,
        ),

        currentWorkshop:
          state.currentWorkshop?._id === workshopId
            ? updatedWorkshop
            : state.currentWorkshop,

        isSubmitting: false,
      }));

      return updatedWorkshop;
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  setCurrentWorkshop: (workshop) => {
    set({
      currentWorkshop: workshop,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },

  reset: () => {
    set({
      ...initialState,
    });
  },
}));

export default useWorkshopStore;
