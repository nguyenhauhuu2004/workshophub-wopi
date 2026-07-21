import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import goongjs, {
  type Map as GoongMap,
  type Marker as GoongMarker,
} from "@goongmaps/goong-js";

export type WorkshopLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId?: string;
  notes: string;
};

type GoongPrediction = {
  description: string;
  place_id: string;
};

type PlaceDetailResponse = {
  result?: {
    formatted_address?: string;
    place_id?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
};

type ReverseGeocodeResponse = {
  results?: Array<{
    formatted_address: string;
    place_id?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  }>;
};

type Props = {
  value: WorkshopLocation;
  onChange: (location: WorkshopLocation) => void;
};

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;
const REST_API_KEY = import.meta.env.VITE_GOONG_REST_API_KEY;

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];

const GoongLocationPicker = ({ value, onChange }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoongMap | null>(null);
  const markerRef = useRef<GoongMarker | null>(null);

  const [query, setQuery] = useState(value.address);
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [searching, setSearching] = useState(false);

  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const moveMarker = (longitude: number, latitude: number, zoom = 16) => {
    if (!mapRef.current) return;

    if (!markerRef.current) {
      markerRef.current = new goongjs.Marker({
        draggable: true,
      })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current?.getLngLat();

        if (!lngLat) return;

        void reverseGeocode(lngLat.lat, lngLat.lng);
      });
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }

    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom,
      essential: true,
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        api_key: REST_API_KEY,
      });

      const response = await fetch(`https://rsapi.goong.io/Geocode?${params}`);

      if (!response.ok) {
        throw new Error(`Reverse geocode lỗi: ${response.status}`);
      }

      const data = (await response.json()) as ReverseGeocodeResponse;

      const result = data.results?.[0];

      const location: WorkshopLocation = {
        ...valueRef.current,
        address: result?.formatted_address ?? `${latitude}, ${longitude}`,
        latitude,
        longitude,
        placeId: result?.place_id ?? "",
      };

      setQuery(location.address);
      setPredictions([]);
      onChangeRef.current(location);
      moveMarker(longitude, latitude);
    } catch (error) {
      console.error("Reverse geocode thất bại:", error);

      const location: WorkshopLocation = {
        ...valueRef.current,
        address: `${latitude}, ${longitude}`,
        latitude,
        longitude,
      };

      setQuery(location.address);
      onChangeRef.current(location);
      moveMarker(longitude, latitude);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!MAPTILES_KEY) {
      console.error("Thiếu VITE_GOONG_MAPTILES_KEY");
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;

    const initialLongitude = value.longitude ?? DEFAULT_CENTER[0];

    const initialLatitude = value.latitude ?? DEFAULT_CENTER[1];

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [initialLongitude, initialLatitude],
      zoom: value.latitude !== null ? 16 : 11,
    });

    map.addControl(new goongjs.NavigationControl(), "top-right");

    map.on("click", (event) => {
      void reverseGeocode(event.lngLat.lat, event.lngLat.lng);
    });

    mapRef.current = map;

    if (value.latitude !== null && value.longitude !== null) {
      moveMarker(value.longitude, value.latitude);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (value.latitude === null || value.longitude === null) {
      return;
    }

    moveMarker(value.longitude, value.latitude);
  }, [value.latitude, value.longitude]);

  useEffect(() => {
    const searchText = query.trim();

    if (searchText.length < 2) {
      setPredictions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);

        const params = new URLSearchParams({
          api_key: REST_API_KEY,
          input: searchText,
        });

        if (
          valueRef.current.latitude !== null &&
          valueRef.current.longitude !== null
        ) {
          params.set(
            "location",
            `${valueRef.current.latitude},${valueRef.current.longitude}`,
          );
        }

        const response = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?${params}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Autocomplete lỗi: ${response.status}`);
        }

        const data = await response.json();

        setPredictions(data.predictions ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Autocomplete thất bại:", error);
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectPrediction = async (prediction: GoongPrediction) => {
    try {
      setSearching(true);

      const params = new URLSearchParams({
        api_key: REST_API_KEY,
        place_id: prediction.place_id,
      });

      const response = await fetch(
        `https://rsapi.goong.io/Place/Detail?${params}`,
      );

      if (!response.ok) {
        throw new Error(`Place Detail lỗi: ${response.status}`);
      }

      const data = (await response.json()) as PlaceDetailResponse;

      const detail = data.result;
      const coordinates = detail?.geometry?.location;

      if (!coordinates) {
        throw new Error("Goong không trả về tọa độ địa điểm");
      }

      const location: WorkshopLocation = {
        ...value,
        address: detail?.formatted_address ?? prediction.description,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        placeId: detail?.place_id ?? prediction.place_id,
      };

      setQuery(location.address);
      setPredictions([]);
      onChange(location);

      moveMarker(coordinates.lng, coordinates.lat);
    } catch (error) {
      console.error("Không thể lấy chi tiết địa điểm:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;

    setQuery(address);

    onChange({
      ...value,
      address,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder="Nhập tên hoặc địa chỉ workshop"
          className="pl-9 pr-10"
          autoComplete="off"
        />

        {searching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {predictions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border bg-background p-1 shadow-xl">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => void selectPrediction(prediction)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-accent"
              >
                <Search className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <span>{prediction.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="h-[360px] w-full overflow-hidden rounded-2xl border"
      />

      <p className="text-xs text-muted-foreground">
        Nhập địa chỉ để tìm kiếm, hoặc click trực tiếp lên bản đồ. Marker có thể
        kéo để điều chỉnh vị trí.
      </p>

      <Textarea
        value={value.notes}
        rows={3}
        placeholder="Ghi chú đường đi, chỗ gửi xe, tầng hoặc lối vào..."
        onChange={(event) =>
          onChange({
            ...value,
            notes: event.target.value,
          })
        }
        className="resize-none"
      />

      {value.latitude !== null && value.longitude !== null && (
        <div className="rounded-xl bg-muted p-3 text-xs">
          <p>{value.address}</p>
          <p className="mt-1 text-muted-foreground">
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoongLocationPicker;
