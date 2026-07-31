import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { workshopReviewService } from "@/services/workshopReviewService";
import { useAuthStore } from "@/stores/useAuthStore";

import type {
  GetWorkshopReviewsResponse,
  WorkshopReview,
  WorkshopReviewEligibility,
  WorkshopReviewImage,
} from "@/types/workshopReview";

type WorkshopReviewsProps = {
  workshopId: string;
};

type LocalReviewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const initialReviewData: GetWorkshopReviewsResponse = {
  reviews: [],
  averageRating: 0,
  reviewCount: 0,

  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },

  page: 1,
  totalPages: 0,
};

const createLocalImage = (file: File): LocalReviewImage => {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    file,
    previewUrl: URL.createObjectURL(file),
  };
};

const formatReviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getReviewUserName = (review: WorkshopReview) => {
  return review.user?.displayName || review.user?.username || "Người tham dự";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const WorkshopReviews = ({ workshopId }: WorkshopReviewsProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [reviewData, setReviewData] =
    useState<GetWorkshopReviewsResponse>(initialReviewData);

  const [eligibility, setEligibility] =
    useState<WorkshopReviewEligibility | null>(null);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const [existingImages, setExistingImages] = useState<WorkshopReviewImage[]>(
    [],
  );

  const [localImages, setLocalImages] = useState<LocalReviewImage[]>([]);

  const [loading, setLoading] = useState(true);

  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const localImagesRef = useRef(localImages);

  localImagesRef.current = localImages;

  useEffect(() => {
    return () => {
      localImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const clearLocalImages = useCallback(() => {
    localImagesRef.current.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    setLocalImages([]);
  }, []);

  const hydrateReviewForm = useCallback(
    (review: WorkshopReview | null) => {
      clearLocalImages();

      setRating(review?.rating ?? 0);
      setHoveredRating(0);
      setComment(review?.comment ?? "");
      setExistingImages(review?.images ?? []);
    },
    [clearLocalImages],
  );

  const loadReviews = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const data = await workshopReviewService.getReviews(workshopId, page);

        setReviewData(data);
      } catch (error) {
        console.error("Load workshop reviews error:", error);

        toast.error(getErrorMessage(error, "Không thể tải đánh giá workshop"));
      } finally {
        setLoading(false);
      }
    },
    [workshopId],
  );

  const loadEligibility = useCallback(async () => {
    if (!accessToken) {
      setEligibility(null);
      hydrateReviewForm(null);
      return;
    }

    try {
      setEligibilityLoading(true);

      const data = await workshopReviewService.getEligibility(workshopId);

      setEligibility(data);
      hydrateReviewForm(data.existingReview);
    } catch (error) {
      console.error("Load review eligibility error:", error);

      setEligibility(null);
    } finally {
      setEligibilityLoading(false);
    }
  }, [accessToken, hydrateReviewForm, workshopId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  const ownReview = eligibility?.existingReview ?? null;

  const canDisplayReviewForm = Boolean(eligibility?.canReview || ownReview);

  const selectedRating = hoveredRating || rating;

  const totalSelectedImages = existingImages.length + localImages.length;

  const distributionRows = useMemo(() => {
    return [5, 4, 3, 2, 1].map((value) => {
      const key = String(value) as keyof typeof reviewData.distribution;

      const count = reviewData.distribution[key] ?? 0;

      const percentage =
        reviewData.reviewCount > 0
          ? Math.round((count / reviewData.reviewCount) * 100)
          : 0;

      return {
        value,
        count,
        percentage,
      };
    });
  }, [reviewData.distribution, reviewData.reviewCount]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    event.target.value = "";

    const availableSlots = MAX_IMAGES - totalSelectedImages;

    if (availableSlots <= 0) {
      toast.error("Mỗi đánh giá chỉ được có tối đa 5 hình ảnh");

      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} không phải hình ảnh`);
        return false;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} vượt quá 5MB`);
        return false;
      }

      return true;
    });

    const acceptedFiles = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      toast.info(`Bạn chỉ có thể thêm ${availableSlots} hình ảnh nữa`);
    }

    setLocalImages((current) => [
      ...current,
      ...acceptedFiles.map(createLocalImage),
    ]);
  };

  const removeLocalImage = (imageId: string) => {
    setLocalImages((current) => {
      const selectedImage = current.find((image) => image.id === imageId);

      if (selectedImage) {
        URL.revokeObjectURL(selectedImage.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });
  };

  const removeExistingImage = (publicId: string) => {
    setExistingImages((current) =>
      current.filter((image) => image.publicId !== publicId),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!eligibility || submitting) {
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    const normalizedComment = comment.trim();

    if (normalizedComment.length > 2000) {
      toast.error("Nội dung đánh giá không được vượt quá 2000 ký tự");

      return;
    }

    try {
      setSubmitting(true);

      if (ownReview) {
        await workshopReviewService.updateReview(workshopId, ownReview._id, {
          rating,
          comment: normalizedComment,

          keepImagePublicIds: existingImages.map((image) => image.publicId),

          images: localImages.map((image) => image.file),
        });

        toast.success("Đã cập nhật đánh giá");
      } else {
        await workshopReviewService.createReview(workshopId, {
          rating,
          comment: normalizedComment,
          images: localImages.map((image) => image.file),
        });

        toast.success("Đánh giá workshop thành công");
      }

      await Promise.all([loadReviews(1), loadEligibility()]);
    } catch (error) {
      console.error("Submit workshop review error:", error);

      toast.error(
        getErrorMessage(
          error,
          ownReview ? "Không thể cập nhật đánh giá" : "Không thể gửi đánh giá",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview || deleting) {
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa đánh giá này không?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await workshopReviewService.deleteReview(workshopId, ownReview._id);

      hydrateReviewForm(null);

      await Promise.all([loadReviews(1), loadEligibility()]);

      toast.success("Đã xóa đánh giá");
    } catch (error) {
      console.error("Delete workshop review error:", error);

      toast.error(getErrorMessage(error, "Không thể xóa đánh giá"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Người tham dự xác thực
          </span>

          <h2 className="mt-2 text-2xl font-black text-foreground">
            Đánh giá workshop
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Chỉ người đã hoàn thành workshop mới có thể đăng đánh giá.
          </p>
        </div>

        {reviewData.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <Star className="size-6 fill-amber-400 text-amber-400" />

            <strong className="text-3xl font-black">
              {reviewData.averageRating.toFixed(1)}
            </strong>

            <span className="text-sm text-muted-foreground">
              / 5 · {reviewData.reviewCount} đánh giá
            </span>
          </div>
        )}
      </div>

      {reviewData.reviewCount > 0 && (
        <div className="mt-7 grid gap-6 rounded-2xl bg-muted/40 p-5 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center justify-center text-center">
            <strong className="text-5xl font-black text-foreground">
              {reviewData.averageRating.toFixed(1)}
            </strong>

            <RatingStars value={Math.round(reviewData.averageRating)} />

            <span className="mt-2 text-xs text-muted-foreground">
              {reviewData.reviewCount} lượt đánh giá
            </span>
          </div>

          <div className="space-y-2">
            {distributionRows.map((row) => (
              <div
                key={row.value}
                className="grid grid-cols-[30px_1fr_36px] items-center gap-3 text-xs"
              >
                <span className="font-semibold">{row.value}★</span>

                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${row.percentage}%`,
                    }}
                  />
                </div>

                <span className="text-right text-muted-foreground">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        {!accessToken ? (
          <LoginRequiredState />
        ) : eligibilityLoading ? (
          <div className="flex min-h-28 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : canDisplayReviewForm ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black">
                  {ownReview ? "Đánh giá của bạn" : "Chia sẻ trải nghiệm"}
                </h3>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  Đã xác minh hoàn thành workshop
                </p>
              </div>

              {ownReview && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Xóa đánh giá
                </Button>
              )}
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold">Bạn đánh giá bao nhiêu sao?</p>

              <div
                className="mt-2 flex w-fit gap-1"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} sao`}
                    aria-pressed={rating === value}
                    onMouseEnter={() => setHoveredRating(value)}
                    onFocus={() => setHoveredRating(value)}
                    onBlur={() => setHoveredRating(0)}
                    onClick={() => setRating(value)}
                    className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Star
                      className={`size-8 ${
                        value <= selectedRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="workshop-review-comment"
                className="text-sm font-bold"
              >
                Nội dung đánh giá
              </label>

              <Textarea
                id="workshop-review-comment"
                rows={5}
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Workshop có gì thú vị? Nghệ nhân hướng dẫn thế nào?..."
                className="mt-2"
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {comment.length}/2000
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">Hình ảnh trải nghiệm</p>

                <span className="text-xs text-muted-foreground">
                  {totalSelectedImages}/{MAX_IMAGES}
                </span>
              </div>

              {(existingImages.length > 0 || localImages.length > 0) && (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {existingImages.map((image) => (
                    <ReviewImagePreview
                      key={image.publicId}
                      src={image.url}
                      onRemove={() => removeExistingImage(image.publicId)}
                    />
                  ))}

                  {localImages.map((image) => (
                    <ReviewImagePreview
                      key={image.id}
                      src={image.previewUrl}
                      onRemove={() => removeLocalImage(image.id)}
                    />
                  ))}
                </div>
              )}

              {totalSelectedImages < MAX_IMAGES && (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-4 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary">
                  <ImagePlus className="size-5" />
                  Thêm hình ảnh
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-6 rounded-full px-6"
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : ownReview ? (
                <Pencil className="mr-2 size-4" />
              ) : (
                <Star className="mr-2 size-4" />
              )}

              {ownReview ? "Lưu đánh giá" : "Gửi đánh giá"}
            </Button>
          </form>
        ) : eligibility?.reason === "not_completed" ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <p className="font-bold text-foreground">Chưa thể đánh giá</p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Bạn chỉ có thể đánh giá sau khi booking được host xác nhận
                  hoàn thành.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 border-t border-border pt-7">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        ) : reviewData.reviews.length > 0 ? (
          <div className="space-y-6">
            {reviewData.reviews.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))}

            {reviewData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={reviewData.page <= 1 || loading}
                  onClick={() => void loadReviews(reviewData.page - 1)}
                >
                  Trang trước
                </Button>

                <span className="text-sm text-muted-foreground">
                  {reviewData.page}/{reviewData.totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  disabled={reviewData.page >= reviewData.totalPages || loading}
                  onClick={() => void loadReviews(reviewData.page + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Star className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-bold">Chưa có đánh giá</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Hãy là người đầu tiên chia sẻ trải nghiệm sau khi hoàn thành
              workshop.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const LoginRequiredState = () => {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <ShieldCheck className="mx-auto size-7 text-primary" />

      <p className="mt-3 font-bold">Bạn đã tham gia workshop này?</p>

      <p className="mt-1 text-sm text-muted-foreground">
        Đăng nhập để kiểm tra quyền đánh giá.
      </p>

      <Link
        to="/signin"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Đăng nhập
      </Link>
    </div>
  );
};

const RatingStars = ({ value }: { value: number }) => {
  return (
    <div className="mt-2 flex gap-0.5" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${
            star <= value ? "fill-amber-400 text-amber-400" : "text-border"
          }`}
        />
      ))}
    </div>
  );
};

type ReviewImagePreviewProps = {
  src: string;
  onRemove: () => void;
};

const ReviewImagePreview = ({ src, onRemove }: ReviewImagePreviewProps) => {
  return (
    <div className="group/image relative aspect-square overflow-hidden rounded-xl bg-muted">
      <img
        src={src}
        alt="Ảnh đánh giá"
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        aria-label="Xóa hình ảnh"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white opacity-100 transition sm:opacity-0 sm:group-hover/image:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

const ReviewItem = ({ review }: { review: WorkshopReview }) => {
  const userName = getReviewUserName(review);

  return (
    <article className="border-b border-border pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        {review.user?.avatarUrl ? (
          <img
            src={review.user.avatarUrl}
            alt={userName}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-black text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold text-foreground">{userName}</p>

              <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Đã tham gia workshop
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>

          <RatingStars value={review.rating} />

          {review.comment && (
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {review.comment}
            </p>
          )}

          {review.images.length > 0 && (
            <div className="mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-5">
              {review.images.map((image) => (
                <a
                  key={image.publicId}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={image.url}
                    alt="Hình ảnh trải nghiệm workshop"
                    loading="lazy"
                    className="h-full w-full object-cover transition hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default WorkshopReviews;
