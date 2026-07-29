import { Clock3, Heart, MapPin, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";

type WorkshopMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

type WorkshopCardProps = {
  _id: string;
  title: string;
  category: string;
  description: string;

  price: number;
  duration: string;
  seatsTotal?: number;

  averageRating?: number;
  reviewCount?: number;
  sponsored?: boolean;

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

type WorkshopCardComponentProps = {
  workshop: WorkshopCardProps;
};

const formatPrice = (price: number) => {
  return `${price.toLocaleString("vi-VN")}đ`;
};

const WorkshopCard = ({ workshop }: WorkshopCardComponentProps) => {
  const averageRating = Math.min(5, Math.max(0, workshop.averageRating ?? 0));

  const reviewCount = Math.max(0, workshop.reviewCount ?? 0);

  const hasReviews = reviewCount > 0;

  return (
    <article
      className="
        group
        h-full
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-card
        shadow-soft
        transition-bounce
        hover:-translate-y-1
        hover:shadow-card
      "
    >
      <Link to={`/workshops/${workshop._id}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden">
          <img
            src={workshop.thumbnail?.url || "/images/workshop-placeholder.jpg"}
            alt={workshop.title}
            className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="flex flex-wrap gap-2">
              {workshop.sponsored && (
                <span
                  className="
                    rounded-full
                    bg-accent
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-accent-foreground
                    shadow-soft
                  "
                >
                  Hot
                </span>
              )}

              <span
                className="
                  rounded-full
                  bg-background/90
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  text-primary
                  backdrop-blur
                  shadow-soft
                "
              >
                {workshop.category}
              </span>
            </div>

            <button
              type="button"
              aria-label="Thêm vào danh sách yêu thích"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="
                flex
                size-9
                items-center
                justify-center
                rounded-full
                bg-background/90
                text-muted-foreground
                backdrop-blur
                shadow-soft
                transition-smooth
                hover:bg-background
                hover:text-accent
              "
            >
              <Heart className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3
            className="
              mb-0
              line-clamp-2
              min-h-[32px]
              text-base
              font-bold
              leading-6
              text-foreground
              transition-colors
              group-hover:text-primary
            "
          >
            {workshop.title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />

            <span className="line-clamp-1">
              {workshop.host?.displayName
                ? `${workshop.host.displayName} · `
                : ""}
              {workshop.location?.address
                ? workshop.location.address
                    .split(",")
                    .map((item) => item.trim())
                    .slice(-2)
                    .join(", ")
                : ""}
            </span>
          </div>

          {/* <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {workshop.description}
          </p> */}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              <span>{workshop.duration}</span>
            </div>

            {workshop.seatsTotal !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                <span>{workshop.seatsTotal} người</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <p className="text-[11px] text-muted-foreground">Giá từ</p>

              <p className="mt-0.5 text-lg font-black text-primary">
                {formatPrice(workshop.price)}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Star
                className={
                  hasReviews
                    ? "size-4 fill-accent text-accent"
                    : "size-4 text-muted-foreground"
                }
              />

              {hasReviews ? (
                <>
                  <span className="font-semibold text-foreground">
                    {averageRating.toFixed(1)}
                  </span>

                  <span className="text-muted-foreground">({reviewCount})</span>
                </>
              ) : (
                <span className="text-muted-foreground">Chưa có đánh giá</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default WorkshopCard;
