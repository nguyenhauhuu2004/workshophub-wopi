"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "@goongmaps/goong-js/dist/goong-js.css";
import goongjs, {
  type Map as GoongMap,
  type Marker as GoongMarker,
} from "@goongmaps/goong-js";
import {
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Workshop } from "@/types/workshop";
import {
  calculateDistanceMeters,
  formatDistance,
  openMapDirections,
} from "@/utils/mapUtils";

const DEFAULT_MAP_ZOOM = 14.5;

export interface WorkshopMapSectionProps {
  currentWorkshop: Workshop;
  nearbyWorkshops?: Workshop[];
  onWorkshopClick?: (workshopId: string) => void;
  className?: string;
}

export default function WorkshopMapSection({
  currentWorkshop,
  nearbyWorkshops = [],
  onWorkshopClick,
  className = "",
}: WorkshopMapSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoongMap | null>(null);
  const markersRef = useRef<GoongMarker[]>([]);

  const [selectedWorkshop, setSelectedWorkshop] =
    useState<Workshop>(currentWorkshop);
  const [mapError, setMapError] = useState<string | null>(null);

  // Khi currentWorkshop thay đổi, cập nhật lại workshop được chọn
  useEffect(() => {
    setSelectedWorkshop(currentWorkshop);
  }, [currentWorkshop]);

  // Lấy tọa độ workshop hiện tại
  const [currentLng, currentLat] =
    currentWorkshop.location.coordinates.coordinates;

  // Lấy tọa độ workshop đang được chọn (để hiển thị và chỉ đường)
  const [selectedLng, selectedLat] =
    selectedWorkshop.location.coordinates.coordinates;

  const isCurrentSelected = selectedWorkshop._id === currentWorkshop._id;

  // Tính khoảng cách nếu đang chọn workshop lân cận
  const distanceText = useMemo(() => {
    if (isCurrentSelected) return null;
    if (
      !Number.isFinite(currentLat) ||
      !Number.isFinite(currentLng) ||
      !Number.isFinite(selectedLat) ||
      !Number.isFinite(selectedLng)
    ) {
      return null;
    }
    const meters = calculateDistanceMeters(
      currentLat,
      currentLng,
      selectedLat,
      selectedLng
    );
    return formatDistance(meters);
  }, [
    isCurrentSelected,
    currentLat,
    currentLng,
    selectedLat,
    selectedLng,
  ]);

  // Khởi tạo bản đồ Goong Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY;
    if (!accessToken) {
      setMapError("Chưa cấu hình VITE_GOONG_MAPTILES_KEY");
      return;
    }

    if (!Number.isFinite(currentLng) || !Number.isFinite(currentLat)) {
      setMapError("Tọa độ workshop không hợp lệ");
      return;
    }

    setMapError(null);
    goongjs.accessToken = accessToken;

    const map = new goongjs.Map({
      container,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [currentLng, currentLat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new goongjs.NavigationControl(), "top-right");
    mapRef.current = map;

    const bounds = new goongjs.LngLatBounds();
    const markers: GoongMarker[] = [];

    // Helper thêm Marker lên bản đồ
    const addWorkshopMarker = (item: Workshop, isCurrent: boolean) => {
      const [lng, lat] = item.location.coordinates.coordinates;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      const popupHtml = `
        <div style="font-family: inherit; padding: 4px;">
          <p style="font-weight: 600; font-size: 13px; margin: 0 0 2px 0; color: #111;">
            ${item.title}
          </p>
          <p style="font-size: 11px; margin: 0; color: #666;">
            ${item.location.address}
          </p>
          <p style="font-size: 12px; margin: 4px 0 0 0; font-weight: 600; color: ${
            isCurrent ? "#166534" : "#d97706"
          };">
            ${
              isCurrent
                ? "Workshop đang xem"
                : `${item.price.toLocaleString("vi-VN")}₫`
            }
          </p>
        </div>
      `;

      const popup = new goongjs.Popup({
        offset: 26,
        closeButton: true,
        closeOnClick: false,
      }).setHTML(popupHtml);

      const marker = new goongjs.Marker({
        color: isCurrent ? "#166534" : "#d97706",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // Thêm tương tác click vào Marker
      const element = marker.getElement();
      element.style.cursor = "pointer";
      element.addEventListener("click", () => {
        setSelectedWorkshop(item);
        map.flyTo({
          center: [lng, lat],
          zoom: 15.5,
          duration: 800,
        });
      });

      bounds.extend([lng, lat]);
      markers.push(marker);
    };

    // Thêm marker workshop chính
    addWorkshopMarker(currentWorkshop, true);

    // Thêm markers các workshop lân cận
    nearbyWorkshops.forEach((nearby) => {
      if (nearby._id !== currentWorkshop._id) {
        addWorkshopMarker(nearby, false);
      }
    });

    // Mở rộng bản đồ bao trọn các markers nếu có workshop lân cận
    if (nearbyWorkshops.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: DEFAULT_MAP_ZOOM,
      });
    }

    markersRef.current = markers;

    return () => {
      markers.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [currentWorkshop, nearbyWorkshops, currentLng, currentLat]);

  // Xử lý chọn workshop từ danh sách bên cạnh
  const handleSelectWorkshop = (item: Workshop) => {
    setSelectedWorkshop(item);
    const [lng, lat] = item.location.coordinates.coordinates;
    if (mapRef.current && Number.isFinite(lng) && Number.isFinite(lat)) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15.5,
        duration: 800,
      });
    }
  };

  // Quay về workshop chính
  const handleRecenter = () => {
    setSelectedWorkshop(currentWorkshop);
    if (
      mapRef.current &&
      Number.isFinite(currentLng) &&
      Number.isFinite(currentLat)
    ) {
      mapRef.current.flyTo({
        center: [currentLng, currentLat],
        zoom: 15,
        duration: 800,
      });
    }
  };

  // Kích hoạt chỉ đường
  const handleGetDirections = () => {
    if (!Number.isFinite(selectedLat) || !Number.isFinite(selectedLng)) return;

    openMapDirections({
      latitude: selectedLat,
      longitude: selectedLng,
      address: selectedWorkshop.location.address,
      title: selectedWorkshop.title,
    });
  };

  return (
    <section className={`mt-8 ${className}`}>
      <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
          {/* CỘT THÔNG TIN WORKSHOP BÊN CẠNH BẢN ĐỒ */}
          <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r bg-muted/20 p-5 sm:p-6">
            <div className="space-y-4">
              {/* Header của thẻ thông tin: Trạng thái & nút quay lại */}
              <div className="flex items-center justify-between gap-2">
                {isCurrentSelected ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1.5 py-1 px-2.5 shadow-xs">
                    <MapPin className="size-3.5" />
                    Workshop hiện tại
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 py-1 px-2.5"
                  >
                    <Compass className="size-3.5" />
                    Workshop lân cận {distanceText ? `(Cách ${distanceText})` : ""}
                  </Badge>
                )}

                {!isCurrentSelected && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRecenter}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" />
                    Về workshop chính
                  </Button>
                )}
              </div>

              {/* Ảnh Thumbnail workshop */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
                {selectedWorkshop.thumbnail?.url ? (
                  <img
                    src={selectedWorkshop.thumbnail.url}
                    alt={selectedWorkshop.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Không có hình ảnh
                  </div>
                )}

                {/* Badge giá vé ở góc ảnh */}
                <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  {selectedWorkshop.price.toLocaleString("vi-VN")}₫ / người
                </div>
              </div>

              {/* Tên và thông tin chi tiết */}
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-2">
                  {selectedWorkshop.title}
                </h3>

                {selectedWorkshop.categories?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedWorkshop.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                    {selectedWorkshop.duration && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {selectedWorkshop.duration}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="rounded-xl border bg-background/80 p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {selectedWorkshop.location.address}
                  </p>
                </div>

                {selectedWorkshop.location.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p>
                      <span className="font-medium text-foreground/80">
                        Ghi chú:{" "}
                      </span>
                      {selectedWorkshop.location.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Khối các nút hành động & Chỉ đường */}
            <div className="mt-5 space-y-2.5 pt-2">
              {/* NÚT CHỈ ĐƯỜNG: Chuyển hướng sang app bản đồ mặc định của thiết bị */}
              <Button
                type="button"
                size="lg"
                onClick={handleGetDirections}
                className="w-full gap-2 font-semibold shadow-sm transition-all"
              >
                <Navigation className="size-4" />
                Chỉ đường (Mở app bản đồ)
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                Tự động mở Apple Maps (iOS) hoặc Google Maps (Android/Web)
              </p>

              {/* Nút xem chi tiết nếu đang bấm xem workshop lân cận */}
              {!isCurrentSelected && onWorkshopClick && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => onWorkshopClick(selectedWorkshop._id)}
                  className="w-full gap-2 text-xs font-medium"
                >
                  Xem chi tiết workshop này
                  <ExternalLink className="size-3.5" />
                </Button>
              )}

              {/* Gợi ý danh sách workshop lân cận nếu có */}
              {nearbyWorkshops.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-500" />
                    Workshop khác gần đây ({nearbyWorkshops.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {/* Nút chọn workshop hiện tại */}
                    <button
                      type="button"
                      onClick={handleRecenter}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-left border transition-colors cursor-pointer ${
                        isCurrentSelected
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <span className="block max-w-[130px] truncate">
                        {currentWorkshop.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        (Hiện tại)
                      </span>
                    </button>

                    {/* Các workshop lân cận */}
                    {nearbyWorkshops.map((nearby) => {
                      const isSelected = selectedWorkshop._id === nearby._id;
                      const [nbLng, nbLat] =
                        nearby.location.coordinates.coordinates;
                      let nbDist: string | null = null;
                      if (
                        Number.isFinite(currentLat) &&
                        Number.isFinite(currentLng) &&
                        Number.isFinite(nbLat) &&
                        Number.isFinite(nbLng)
                      ) {
                        nbDist = formatDistance(
                          calculateDistanceMeters(
                            currentLat,
                            currentLng,
                            nbLat,
                            nbLng
                          )
                        );
                      }

                      return (
                        <button
                          key={nearby._id}
                          type="button"
                          onClick={() => handleSelectWorkshop(nearby)}
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-left border transition-colors cursor-pointer ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <span className="block max-w-[130px] truncate">
                            {nearby.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {nbDist ? `${nbDist} • ` : ""}
                            {nearby.price.toLocaleString("vi-VN")}₫
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT BẢN ĐỒ GOONG MAP */}
          <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] h-full w-full bg-muted/40">
            {mapError ? (
              <div className="flex h-full min-h-[380px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {mapError}
              </div>
            ) : (
              <div ref={containerRef} className="h-full w-full" />
            )}

            {/* Nút quay về nhanh vị trí workshop chính đặt góc dưới bản đồ */}
            <div className="absolute bottom-4 left-4 z-10">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRecenter}
                className="gap-1.5 bg-background/90 backdrop-blur-md shadow-md hover:bg-background text-xs"
              >
                <Navigation className="size-3.5 text-primary" />
                Vị trí workshop chính
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
