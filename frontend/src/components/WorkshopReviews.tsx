import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useAuthStore } from "@/stores/useAuthStore";
import { workshopService } from "@/services/workshopService";

type ReviewUser = {
  _id: string;
  displayName: string;
  avatarUrl?: string;
};

type WorkshopReview = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: ReviewUser;
};

type ReviewDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: ReviewDistribution;
};

type ReviewsResponse = {
  reviews: WorkshopReview[];
  summary: ReviewSummary;
};

type Props = {
  workshopId: string;
};

const EMPTY_SUMMARY: ReviewSummary = {
  averageRating: 0,
  totalReviews: 0,
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

const WorkshopReviews = ({ workshopId }: Props) => {
  const user = useAuthStore((state) => state.user);

  const [reviews, setReviews] = useState<WorkshopReview[]>([]);

  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const data: ReviewsResponse =
        await workshopService.getReviews(workshopId);

      setReviews(data.reviews ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (error) {
      console.error("Load reviews error:", error);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để đánh giá workshop");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao");
      return;
    }

    if (comment.trim().length < 5) {
      toast.error("Nội dung đánh giá phải có ít nhất 5 ký tự");
      return;
    }

    try {
      setSubmitting(true);

      await workshopService.createReview(workshopId, {
        rating,
        comment: comment.trim(),
      });

      toast.success("Đã gửi đánh giá");

      setRating(0);
      setHoverRating(0);
      setComment("");

      await loadReviews();
    } catch (error) {
      console.error("Create review error:", error);
      toast.error(
        "Không thể gửi đánh giá. Bạn có thể đã đánh giá workshop này.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 border-t pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-6 text-primary" />

        <h2 className="text-2xl font-semibold">Đánh giá từ người tham gia</h2>
      </div>

      <div className="mt-6 grid gap-6 rounded-2xl border p-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center border-b pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <p className="text-5xl font-bold">
            {summary.averageRating.toFixed(1)}
          </p>

          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={
                  star <= Math.round(summary.averageRating)
                    ? "size-5 fill-amber-400 text-amber-400"
                    : "size-5 text-muted-foreground/40"
                }
              />
            ))}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {summary.totalReviews} đánh giá
          </p>
        </div>

        <div className="space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[star] ?? 0;

            const percentage =
              summary.totalReviews > 0
                ? Math.round((count / summary.totalReviews) * 100)
                : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-8 text-sm">{star}★</span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="w-8 text-right text-sm text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border p-5">
        <h3 className="font-semibold">Viết đánh giá của bạn</h3>

        {!user && (
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn cần đăng nhập trước khi gửi đánh giá.
          </p>
        )}

        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={!user || submitting}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} sao`}
            >
              <Star
                className={
                  star <= (hoverRating || rating)
                    ? "size-7 fill-amber-400 text-amber-400"
                    : "size-7 text-muted-foreground/40"
                }
              />
            </button>
          ))}
        </div>

        <Textarea
          value={comment}
          disabled={!user || submitting}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về workshop..."
          rows={4}
          maxLength={1000}
          className="mt-4 resize-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {comment.length}/1000
          </span>

          <Button
            type="button"
            disabled={
              !user || submitting || rating === 0 || comment.trim().length < 5
            }
            onClick={() => void handleSubmit()}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Gửi đánh giá
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            Chưa có đánh giá nào cho workshop này.
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-2xl border p-5">
                <div className="flex items-start gap-3">
                  {review.user.avatarUrl ? (
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.displayName}
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                      {review.user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {review.user.displayName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                          }).format(new Date(review.createdAt))}
                        </p>
                      </div>

                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={
                              star <= review.rating
                                ? "size-4 fill-amber-400 text-amber-400"
                                : "size-4 text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WorkshopReviews;
