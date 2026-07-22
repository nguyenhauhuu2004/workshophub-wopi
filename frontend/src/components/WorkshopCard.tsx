import { Link } from "react-router";

type WorkshopCardProps = {
  workshop: {
    _id: string;
    title: string;
    category: string;
    description: string;
    price: number;
    duration: string;
    level: string;

    thumbnail?: {
      url: string;
    };

    host?: {
      displayName: string;
      avatarUrl?: string;
    };

    location: {
      address: string;
    };
  };
};

const WorkshopCard = ({ workshop }: WorkshopCardProps) => {
  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-lg hover:scale-105">
      <Link to={`/workshops/${workshop._id}`}>
        <img
          src={workshop.thumbnail?.url || "/images/workshop-placeholder.jpg"}
          alt={workshop.title}
          className="aspect-[4/3] w-full object-cover"
        />

        <div className="p-4">
          <span className="text-xs font-semibold text-violet-600">
            {workshop.category}
          </span>

          <h3 className="mt-2 line-clamp-2 text-lg font-bold">
            {workshop.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {workshop.description}
          </p>

          <p className="mt-3 line-clamp-1 text-sm text-gray-500">
            {workshop.location.address}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-bold text-violet-700">
              {workshop.price.toLocaleString("vi-VN")}đ
            </span>

            <span className="text-sm text-gray-500">{workshop.duration}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default WorkshopCard;
