"use client";

import { useEffect, useRef, useState } from "react";

export type ProductMedia =
  | {
      id: string | number;
      type: "image";
      src: string;
      alt: string;
    }
  | {
      id: string | number;
      type: "video";
      src: string;
      poster: string;
      alt: string;
      autoPlay?: boolean;
      muted?: boolean;
      loop?: boolean;
    };

type ThumbnailSliderProps = {
  media: ProductMedia[];
  initialIndex?: number;
  className?: string;
};

export default function ThumbnailSlider({
  media,
  initialIndex = 0,
  className = "",
}: ThumbnailSliderProps) {
  const safeInitialIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(media.length - 1, 0),
  );

  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeMedia = media[activeIndex];

  useEffect(() => {
    if (activeIndex >= media.length) {
      setActiveIndex(Math.max(media.length - 1, 0));
    }
  }, [activeIndex, media.length]);

  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[activeIndex];

    activeThumbnail?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  useEffect(() => {
    if (activeMedia?.type !== "video" || !videoRef.current) {
      return;
    }

    videoRef.current.currentTime = 0;

    if (activeMedia.autoPlay) {
      videoRef.current.play().catch(() => undefined);
    }
  }, [activeIndex, activeMedia]);

  if (!media.length) {
    return (
      <div
        className={[
          "grid aspect-video w-full place-items-center",
          "rounded-2xl bg-neutral-100 text-sm text-neutral-500",
          className,
        ].join(" ")}
      >
        Không có media
      </div>
    );
  }

  const selectMedia = (index: number) => {
    setActiveIndex(index);
  };

  const previousMedia = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? media.length - 1 : currentIndex - 1,
    );
  };

  const nextMedia = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === media.length - 1 ? 0 : currentIndex + 1,
    );
  };

  return (
    <section
      aria-label="Thư viện sản phẩm"
      className={`min-w-0 w-full ${className}`}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
        {activeMedia.type === "image" ? (
          <img
            key={activeMedia.id}
            src={activeMedia.src}
            alt={activeMedia.alt}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            key={activeMedia.id}
            ref={videoRef}
            src={activeMedia.src}
            poster={activeMedia.poster}
            controls
            playsInline
            autoPlay={activeMedia.autoPlay}
            muted={activeMedia.muted ?? true}
            loop={activeMedia.loop}
            aria-label={activeMedia.alt}
            className="h-full w-full object-cover"
          />
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousMedia}
              aria-label="Media trước"
              className={[
                "absolute left-3 top-1/2 z-10",
                "grid h-10 w-10 -translate-y-1/2 place-items-center",
                "rounded-full bg-white/90 text-2xl text-black shadow",
                "hover:bg-white",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextMedia}
              aria-label="Media tiếp theo"
              className={[
                "absolute right-3 top-1/2 z-10",
                "grid h-10 w-10 -translate-y-1/2 place-items-center",
                "rounded-full bg-white/90 text-2xl text-black shadow",
                "hover:bg-white",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {media.map((item, index) => {
          const isActive = activeIndex === index;

          const thumbnailSource =
            item.type === "image" ? item.src : item.poster;

          return (
            <button
              key={item.id}
              ref={(element) => {
                thumbnailRefs.current[index] = element;
              }}
              type="button"
              onClick={() => selectMedia(index)}
              aria-label={`Xem ${item.type === "video" ? "video" : "ảnh"} ${
                index + 1
              }`}
              aria-current={isActive ? "true" : undefined}
              className={[
                "relative w-32 shrink-0 snap-center",
                "overflow-hidden rounded-xl border-2 bg-neutral-100",
                isActive
                  ? "border-black"
                  : "border-transparent opacity-60 hover:opacity-100",
              ].join(" ")}
            >
              <div className="aspect-video w-full">
                <img
                  src={thumbnailSource}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </div>

              {item.type === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-black/10">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs text-black shadow">
                    ▶
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}