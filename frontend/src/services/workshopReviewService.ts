import api from "@/lib/axios";

import type {
  CreateWorkshopReviewPayload,
  GetWorkshopReviewsResponse,
  UpdateWorkshopReviewPayload,
  WorkshopReview,
  WorkshopReviewEligibility,
} from "@/types/workshopReview";

const appendImages = (formData: FormData, images: File[]) => {
  images.forEach((image) => {
    formData.append("images", image);
  });
};

export const workshopReviewService = {
  getReviews: async (
    workshopId: string,
    page = 1,
  ): Promise<GetWorkshopReviewsResponse> => {
    const response = await api.get(`/workshops/${workshopId}/reviews`, {
      params: {
        page,
        limit: 10,
      },
    });

    return response.data;
  },

  getEligibility: async (
    workshopId: string,
  ): Promise<WorkshopReviewEligibility> => {
    const response = await api.get(
      `/workshops/${workshopId}/reviews/eligibility`,
    );

    return response.data;
  },

  createReview: async (
    workshopId: string,
    payload: CreateWorkshopReviewPayload,
  ): Promise<WorkshopReview> => {
    const formData = new FormData();

    formData.append("rating", String(payload.rating));
    formData.append("comment", payload.comment);

    appendImages(formData, payload.images);

    const response = await api.post(
      `/workshops/${workshopId}/reviews`,
      formData,
    );

    return response.data.review;
  },

  updateReview: async (
    workshopId: string,
    reviewId: string,
    payload: UpdateWorkshopReviewPayload,
  ): Promise<WorkshopReview> => {
    const formData = new FormData();

    formData.append("rating", String(payload.rating));
    formData.append("comment", payload.comment);

    formData.append(
      "keepImagePublicIds",
      JSON.stringify(payload.keepImagePublicIds),
    );

    appendImages(formData, payload.images);

    const response = await api.patch(
      `/workshops/${workshopId}/reviews/${reviewId}`,
      formData,
    );

    return response.data.review;
  },

  deleteReview: async (workshopId: string, reviewId: string): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/reviews/${reviewId}`);
  },
};
