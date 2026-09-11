/**
 * Tiện ích bản đồ và điều hướng chỉ đường cho WorkshopHub
 */

export interface DirectionsParams {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
}

/**
 * Kiểm tra thiết bị hiện tại có phải là thiết bị của Apple (iOS - iPhone, iPad, iPod) hay không
 */
export function isAppleDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent =
    navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || "";

  // Kiểm tra iPhone, iPad, iPod hoặc iPadOS (MacIntel với đa điểm chạm)
  const isIOS =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return isIOS;
}

/**
 * Sinh URL chỉ đường tối ưu theo thiết bị:
 * - Thiết bị Apple: Lược đồ Apple Maps (https://maps.apple.com/?daddr=...)
 * - Thiết bị Android & máy tính: Universal link Google Maps (https://www.google.com/maps/dir/?api=1&destination=...)
 */
export function getDirectionsUrl({
  latitude,
  longitude,
  address,
  title,
}: DirectionsParams): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "#";
  }

  const isApple = isAppleDevice();

  if (isApple) {
    // Apple Maps: dirflg=d (chỉ đường lái xe), q là tên hiển thị
    const label = encodeURIComponent(title || address || "Workshop");
    return `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}&dirflg=d`;
  }

  // Google Maps: Universal link mở app Google Maps trên Android hoặc web trên PC
  const destination = `${latitude},${longitude}`;
  const encodedDest = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;
}

/**
 * Mở trực tiếp chỉ đường trong ứng dụng bản đồ mặc định của thiết bị
 */
export function openMapDirections(params: DirectionsParams): void {
  const url = getDirectionsUrl(params);
  if (url && url !== "#") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Tính khoảng cách gần đúng (theo đường chim bay) giữa 2 tọa độ (mét) bằng công thức Haversine
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Bán kính trái đất tính bằng mét
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Định dạng khoảng cách mét sang chuỗi dễ đọc (ví dụ: "850 m", "2.4 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
