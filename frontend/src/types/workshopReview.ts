export type WorkshopReviewImage = {
  url: string;
  publicId: string;
  resourceType: "image";
};

export type WorkshopReviewUser = {
  _id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
};

export type WorkshopReview = {
  _id: string;
  workshop: string;
  booking: string;

  user: WorkshopReviewUser;

  rating: number;
  comment: string;
  images: WorkshopReviewImage[];

  createdAt: string;
  updatedAt: string;
};

export type WorkshopReviewDistribution = Record<
  "1" | "2" | "3" | "4" | "5",
  number
>;

export type GetWorkshopReviewsResponse = {
  reviews: WorkshopReview[];

  averageRating: number;
  reviewCount: number;

  distribution: WorkshopReviewDistribution;

  page: number;
  totalPages: number;
};

export type ReviewEligibilityReason =
  | "eligible"
  | "not_completed"
  | "already_reviewed";

export type WorkshopReviewEligibility = {
  canReview: boolean;
  reason: ReviewEligibilityReason;
  bookingId: string | null;
  existingReview: WorkshopReview | null;
};

export type CreateWorkshopReviewPayload = {
  rating: number;
  comment: string;
  images: File[];
};

export type UpdateWorkshopReviewPayload = {
  rating: number;
  comment: string;
  keepImagePublicIds: string[];
  images: File[];
};
